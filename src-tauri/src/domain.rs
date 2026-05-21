use std::net::ToSocketAddrs;
use std::process::Command;
use native_tls::TlsConnector;
use serde::Serialize;

#[derive(Serialize)]
pub struct DnsResult {
    pub addresses: Vec<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct PingResult {
    pub success: bool,
    pub output: String,
    pub stats: Option<PingStats>,
}

#[derive(Serialize)]
pub struct PingStats {
    pub sent: u32,
    pub received: u32,
    pub lost: u32,
    pub min_ms: f64,
    pub max_ms: f64,
    pub avg_ms: f64,
}

#[derive(Serialize)]
pub struct SslResult {
    pub valid: bool,
    pub subject: Option<String>,
    pub issuer: Option<String>,
    pub not_before: Option<String>,
    pub not_after: Option<String>,
    pub days_remaining: Option<i64>,
    pub error: Option<String>,
}

#[tauri::command]
pub fn resolve_dns(domain: String) -> DnsResult {
    match (domain.as_str(), 443).to_socket_addrs() {
        Ok(addrs) => {
            let addresses: Vec<String> = addrs.map(|a| a.ip().to_string()).collect();
            DnsResult { addresses, error: None }
        }
        Err(e) => DnsResult {
            addresses: vec![],
            error: Some(format!("DNS 解析失败: {}", e)),
        },
    }
}

#[tauri::command]
pub fn ping_domain(domain: String) -> PingResult {
    let output = if cfg!(target_os = "windows") {
        Command::new("ping")
            .args(["-n", "4", &domain])
            .output()
    } else {
        Command::new("ping")
            .args(["-c", "4", &domain])
            .output()
    };

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            let stderr = String::from_utf8_lossy(&o.stderr).to_string();
            let combined = format!("{}{}", stdout, stderr);
            let stats = parse_ping_stats(&combined);
            PingResult {
                success: o.status.success() || stats.is_some(),
                output: combined,
                stats,
            }
        }
        Err(e) => PingResult {
            success: false,
            output: format!("Ping 执行失败: {}", e),
            stats: None,
        },
    }
}

fn parse_ping_stats(output: &str) -> Option<PingStats> {
    if cfg!(target_os = "windows") {
        // Windows: "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
        let sent: u32 = output.lines()
            .find(|l| l.contains("Sent ="))
            .and_then(|l| l.split("Sent =").nth(1))
            .and_then(|s| s.split(',').next())
            .and_then(|s| s.trim().parse().ok())?;
        let received: u32 = output.lines()
            .find(|l| l.contains("Received ="))
            .and_then(|l| l.split("Received =").nth(1))
            .and_then(|s| s.split(',').next())
            .and_then(|s| s.trim().parse().ok())?;
        let lost = sent.saturating_sub(received);
        // "Minimum = 10ms, Maximum = 20ms, Average = 15ms"
        let ms_line = output.lines().find(|l| l.contains("Minimum"))?;
        let min_ms = extract_ms(ms_line, "Minimum = ")?;
        let max_ms = extract_ms(ms_line, "Maximum = ")?;
        let avg_ms = extract_ms(ms_line, "Average = ")?;
        Some(PingStats { sent, received, lost, min_ms, max_ms, avg_ms })
    } else {
        // Linux/Mac: "4 packets transmitted, 4 received, 0% packet loss"
        let stats_line = output.lines()
            .find(|l| l.contains("packets transmitted") && l.contains("received"))?;
        let sent: u32 = stats_line.split("packets transmitted").next()?.trim().parse().ok()?;
        let received: u32 = stats_line.split("received").next()?.trim().split(',').next()?.trim().parse().ok()?;
        let lost = sent.saturating_sub(received);
        // "rtt min/avg/max/mdev = 10.0/15.0/20.0/3.0 ms"
        let rtt_line = output.lines().find(|l| l.contains("rtt min"))?;
        let rtt_part = rtt_line.split('=').nth(1)?;
        let parts: Vec<&str> = rtt_part.trim().split('/').collect();
        let min_ms = parts.first()?.trim().parse().ok()?;
        let avg_ms = parts.get(1)?.trim().parse().ok()?;
        let max_ms = parts.get(2)?.trim().parse().ok()?;
        Some(PingStats { sent, received, lost, min_ms, max_ms, avg_ms })
    }
}

fn extract_ms(line: &str, prefix: &str) -> Option<f64> {
    line.split(prefix).nth(1)?.split("ms").next()?.trim().parse().ok()
}

#[tauri::command]
pub fn check_ssl(domain: String) -> SslResult {
    let addr = format!("{}:443", domain);
    let connector = match TlsConnector::builder().build() {
        Ok(c) => c,
        Err(e) => return SslResult {
            valid: false, subject: None, issuer: None,
            not_before: None, not_after: None, days_remaining: None,
            error: Some(format!("TLS 连接器创建失败: {}", e)),
        },
    };

    let stream = match std::net::TcpStream::connect(&addr) {
        Ok(s) => s,
        Err(e) => return SslResult {
            valid: false, subject: None, issuer: None,
            not_before: None, not_after: None, days_remaining: None,
            error: Some(format!("TCP 连接失败: {}", e)),
        },
    };

    let tls_stream = match connector.connect(&domain, stream) {
        Ok(s) => s,
        Err(e) => return SslResult {
            valid: false, subject: None, issuer: None,
            not_before: None, not_after: None, days_remaining: None,
            error: Some(format!("TLS 握手失败: {}", e)),
        },
    };

    let certs = match tls_stream.peer_certificate() {
        Ok(Some(c)) => c,
        Ok(None) => return SslResult {
            valid: false, subject: None, issuer: None,
            not_before: None, not_after: None, days_remaining: None,
            error: Some("未获取到证书".to_string()),
        },
        Err(e) => return SslResult {
            valid: false, subject: None, issuer: None,
            not_before: None, not_after: None, days_remaining: None,
            error: Some(format!("获取证书失败: {}", e)),
        },
    };

    let der = certs.to_der().unwrap_or_default();
    let (not_after_unix, not_before_unix, subject_str, issuer_str) =
        match x509_parser::parse_x509_certificate(&der) {
            Ok((_, cert)) => {
                let subj = cert.subject().to_string();
                let iss = cert.issuer().to_string();
                let before = cert.validity().not_before.timestamp();
                let after = cert.validity().not_after.timestamp();
                (after, before, subj, iss)
            }
            Err(_) => {
                return SslResult {
                    valid: false, subject: None, issuer: None,
                    not_before: None, not_after: None, days_remaining: None,
                    error: Some("解析证书失败".to_string()),
                }
            }
        };

    let now = chrono::Utc::now().timestamp();
    let days_remaining = ((not_after_unix - now) / 86400).max(0);

    SslResult {
        valid: days_remaining > 0,
        subject: Some(subject_str),
        issuer: Some(issuer_str),
        not_before: Some(chrono::DateTime::from_timestamp(not_before_unix, 0)
            .map(|d| d.format("%Y-%m-%d").to_string()).unwrap_or_default()),
        not_after: Some(chrono::DateTime::from_timestamp(not_after_unix, 0)
            .map(|d| d.format("%Y-%m-%d").to_string()).unwrap_or_default()),
        days_remaining: Some(if days_remaining > 36500 { 0 } else { days_remaining }),
        error: None,
    }
}
