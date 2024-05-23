use pcap::Capture;
use std::collections::{HashSet, HashMap};
use std::sync::{Arc, Mutex};
use std::sync::mpsc::channel;
use std::thread;
use std::time::{Duration, Instant};
use reqwest::blocking::Client;
use std::net::TcpListener;
use tungstenite::accept;
use serde_json;
use sysinfo::{System, SystemExt, ProcessorExt};
use sha2::{Sha256, Digest};
use pnet::packet::ip::IpNextHeaderProtocols;
use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::ipv6::Ipv6Packet;
use pnet::packet::Packet;
use pnet::packet::tcp::TcpPacket;
use pnet::packet::udp::UdpPacket;

fn main() {
    let unique_src_ips = Arc::new(Mutex::new(HashSet::new()));
    let unique_dst_ips = Arc::new(Mutex::new(HashSet::new()));
    let important_ports = Arc::new(Mutex::new(HashMap::new()));

    // Start WebSocket server on port 4000
    thread::spawn(|| {
        let server = TcpListener::bind("0.0.0.0:4000").expect("Failed to bind to port 4000");
        println!("Rust WebSocket server started on port 4000");
        println!("Contacting Go Program...");

        for stream in server.incoming() {
            match stream {
                Ok(stream) => {
                    let mut websocket = accept(stream).expect("Failed to accept WebSocket connection");
                    loop {
                        let msg = websocket.read_message().expect("Error reading message");
                        if msg.is_binary() || msg.is_text() {
                            println!("Received message: {:?}", msg);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to accept connection: {:?}", e);
                }
            }
        }
    });

    // Give the WebSocket server some time to start
    thread::sleep(Duration::from_secs(5));

    // Retry logic for notifying Go server that Rust is ready
    let client = Client::new();
    let url = "http://go-program:5001/rust-ready";
    let mut success = false;

    while !success {
        match client.post(url).send() {
            Ok(_) => {
                println!("Successfully notified Go server that Rust is ready");
                success = true;
            }
            Err(e) => {
                eprintln!("Failed to notify Go server: {:?}", e);
                thread::sleep(Duration::from_secs(5));
            }
        }
    }

    let (tx, rx) = channel();
    let rx = Arc::new(Mutex::new(rx));
    let rx_clone = Arc::clone(&rx);

    // Start a new thread for packet capture
    thread::spawn({
        let unique_src_ips = Arc::clone(&unique_src_ips);
        let unique_dst_ips = Arc::clone(&unique_dst_ips);
        let important_ports = Arc::clone(&important_ports);

        move || {
            let mut cap = Capture::from_device("eth0")
                .unwrap()
                .promisc(true)
                .snaplen(5000)
                .timeout(1000)
                .open()
                .unwrap();

            loop {
                match cap.next_packet() {
                    Ok(packet) => {
                        let data = packet.data.to_vec();
                        if let Err(e) = tx.send(data.clone()) {
                            eprintln!("Failed to send packet data: {:?}", e);
                        }
                        println!("Data captured and sent to channel.");

                        // Process packet to track unique IPs
                        let src_ip = extract_src_ip(&data);
                        let dst_ip = extract_dst_ip(&data);

                        {
                            let mut src_ips = unique_src_ips.lock().unwrap();
                            src_ips.insert(src_ip);
                        }
                        {
                            let mut dst_ips = unique_dst_ips.lock().unwrap();
                            dst_ips.insert(dst_ip);
                        }

                        // Check for important ports activity
                        let important_ports_list = [22, 80, 443, 23, 3389, 21, 25, 53, 445, 8080];
                        for port in &important_ports_list {
                            if is_important_port_activity(&data, *port) {
                                println!("Important port activity detected for port {}", port);
                                let mut ports = important_ports.lock().unwrap();
                                *ports.entry(*port).or_insert(0) += 1;
                            }
                        }

                        // Calculate and compare SHA-256 hash for file integrity
                        let file_hash = calculate_sha256(&data);
                        if is_known_malicious_hash(&file_hash) {
                            println!("SHA-based detection: Malicious file detected");
                        }
                    }
                    Err(e) => {
                        eprintln!("Error capturing packet: {:?}", e);
                        thread::sleep(Duration::from_secs(5));
                    }
                }
            }
        }
    });

    // HTTP URL for sending data to Go server
    let data_url = "http://go-program:5001/receive-data";

    // Infinite loop to send data over 10-second windows
    thread::spawn(move || {
        let client = Client::new();
        let mut system = System::new_all();

        loop {
            println!("Starting data collection cycle...");
            let start = Instant::now();
            let mut collected_data = Vec::new();

            // Collect network packets
            while start.elapsed() < Duration::from_secs(10) {
                if let Ok(data) = rx_clone.lock().unwrap().try_recv() {
                    collected_data.push(data);
                }
            }

            // Collect system metrics
            system.refresh_all();
            let cpu_usage = system.global_processor_info().cpu_usage();
            let memory_usage = system.used_memory() as f64 / system.total_memory() as f64 * 100.0;

            // Combine data
            let mut data = serde_json::Map::new();
            data.insert("network_packets".to_string(), serde_json::json!(collected_data));
            data.insert("cpu_usage".to_string(), serde_json::json!(cpu_usage));
            data.insert("memory_usage".to_string(), serde_json::json!(memory_usage));

            // Add unique IPs, number of hosts, and important ports
            let unique_src_ips = unique_src_ips.lock().unwrap().len();
            let unique_dst_ips = unique_dst_ips.lock().unwrap().len();
            let important_ports = important_ports.lock().unwrap().clone();
            data.insert("unique_src_ips".to_string(), serde_json::json!(unique_src_ips));
            data.insert("unique_dst_ips".to_string(), serde_json::json!(unique_dst_ips));
            data.insert("num_hosts".to_string(), serde_json::json!(unique_src_ips + unique_dst_ips));
            data.insert("important_ports".to_string(), serde_json::json!(important_ports));

            if data.is_empty() {
                println!("No data collected in this cycle.");
                continue;
            }

            // Serialize collected data
            let serialized_data = match serde_json::to_vec(&data) {
                Ok(data) => data,
                Err(e) => {
                    eprintln!("Failed to serialize data: {:?}", e);
                    continue;
                }
            };

            // Send collected data to Go server
            let response = client.post(data_url)
                .body(serialized_data)
                .send();

            match response {
                Ok(_) => println!("Data sent to Go server!"),
                Err(e) => eprintln!("Failed to send data to Go server: {:?}", e),
            }
        }
    });

    // Prevent the main thread from exiting
    loop {
        println!("Main thread parked.");
        thread::park();
    }
}

fn extract_src_ip(data: &[u8]) -> String {
    if let Some(packet) = Ipv4Packet::new(data) {
        return packet.get_source().to_string();
    } else if let Some(packet) = Ipv6Packet::new(data) {
        return packet.get_source().to_string();
    }
    "Unknown".to_string()
}

fn extract_dst_ip(data: &[u8]) -> String {
    if let Some(packet) = Ipv4Packet::new(data) {
        return packet.get_destination().to_string();
    } else if let Some(packet) = Ipv6Packet::new(data) {
        return packet.get_destination().to_string();
    }
    "Unknown".to_string()
}

fn is_important_port_activity(data: &[u8], port: u16) -> bool {
    if let Some(packet) = TcpPacket::new(data) {
        return packet.get_source() == port || packet.get_destination() == port;
    } else if let Some(packet) = UdpPacket::new(data) {
        return packet.get_source() == port || packet.get_destination() == port;
    }
    false
}

fn calculate_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

fn is_known_malicious_hash(_hash: &str) -> bool {
    // Implement logic to check against known malicious hashes
    // Placeholder implementation
    false
}