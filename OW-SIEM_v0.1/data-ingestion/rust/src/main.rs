use pcap::Capture;
use std::sync::{Arc, Mutex};
use std::sync::mpsc::channel;
use std::thread;
use std::time::{Duration, Instant};
use reqwest::blocking::Client;
use std::net::TcpListener;
use tungstenite::accept;
use serde_json;

fn main() {
    // Start WebSocket server on port 4000
    thread::spawn(|| {
        let server = TcpListener::bind("0.0.0.0:4000").unwrap();
        println!("Rust WebSocket server started on port 4000");
        println!("Contacting Go Program...");

        for stream in server.incoming() {
            let mut websocket = accept(stream.unwrap()).unwrap();
            loop {
                let msg = websocket.read_message().expect("Error reading message");
                if msg.is_binary() || msg.is_text() {
                    println!("Received message: {:?}", msg);
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
    thread::spawn(move || {
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
                    tx.send(data).expect("Failed to send packet data");
                    println!("Data captured and sent to channel.");
                }
                Err(e) => {
                    eprintln!("Error capturing packet: {:?}", e);
                    thread::sleep(Duration::from_secs(5));
                }
            }
        }
    });

    // HTTP URL for sending data to Go server
    let data_url = "http://go-program:5001/receive-data";

    // Infinite loop to send data over 10-second windows
    loop {
        println!("Starting data collection cycle...");
        let start = Instant::now();
        let mut collected_data = Vec::new();

        while start.elapsed() < Duration::from_secs(10) {
            if let Ok(data) = rx_clone.lock().unwrap().try_recv() {
                collected_data.push(data);
            }
        }

        if collected_data.is_empty() {
            println!("No data collected in this cycle.");
            continue;
        }

        // Serialize collected data
        let serialized_data = match serde_json::to_vec(&collected_data) {
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
}
