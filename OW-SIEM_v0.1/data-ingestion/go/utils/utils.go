package utils

import (
    "log"
    "net"
    "omenweave-siem/common"
)

func InitLocalIP() {
    addrs, err := net.InterfaceAddrs()
    if err != nil {
        log.Fatalf("Error getting local IP address: %v", err)
    }

    for _, addr := range addrs {
        if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
            if ipnet.IP.To4() != nil {
                common.OurIP = ipnet.IP.String()
                return
            }
        }
    }
    log.Fatal("Could not determine local IP address")
}
