package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"sort"
	"sync/atomic"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/gorilla/websocket"

	"omenweave-siem/common"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

func WSHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Frontend WebSocket connection attempt")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	defer conn.Close()

	log.Println("Frontend WebSocket connection established")
	common.FrontendConns[conn] = true

	for {
		if _, _, err := conn.NextReader(); err != nil {
			conn.Close()
			delete(common.FrontendConns, conn)
			break
		}
	}
}

func RustReadyHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Message received: Rust ready.")
	common.StartRustConnection()
}

func ReceiveDataHandler(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, "Unable to read request body", http.StatusBadRequest)
		return
	}
	log.Printf("Received data from Rust.")

	var receivedData common.ReceivedData
	err = json.Unmarshal(body, &receivedData)
	if err != nil {
		log.Printf("Error unmarshaling packets: %v", err)
		return
	}

	var srcIPs []byte

	common.Mutex.Lock()
	defer common.Mutex.Unlock()

	for _, packetData := range receivedData.NetworkPackets {
		packet := gopacket.NewPacket(packetData, layers.LayerTypeEthernet, gopacket.Default)
		networkLayer := packet.NetworkLayer()
		transportLayer := packet.TransportLayer()
		if networkLayer == nil || transportLayer == nil {
			continue
		}

		srcIP := networkLayer.NetworkFlow().Src().String()
		dstIP := networkLayer.NetworkFlow().Dst().String()
		packetSize := len(packetData)

		log.Printf("Packet - srcIP: %s, dstIP: %s, packetSize: %d", srcIP, dstIP, packetSize)

		if dstIP == common.OurIP {
			common.SourceToOurIP[srcIP] += packetSize
			common.UpdateEMA(common.SourceToOurIPEMA, srcIP, float64(packetSize))
			log.Printf("Updated sourceToOurIP[%s]: %d", srcIP, common.SourceToOurIP[srcIP])
			log.Printf("Updated sourceToOurIPEMA[%s]: %f", srcIP, common.SourceToOurIPEMA[srcIP])
		}

		if srcIP == common.OurIP {
			common.DestinationFromOurIP[dstIP] += packetSize
			common.UpdateEMA(common.DestinationFromOurIPEMA, dstIP, float64(packetSize))
			log.Printf("Updated destinationFromOurIP[%s]: %d", dstIP, common.DestinationFromOurIP[dstIP])
			log.Printf("Updated destinationFromOurIPEMA[%s]: %f", dstIP, common.DestinationFromOurIPEMA[dstIP])
		}

		srcIPs = append(srcIPs, networkLayer.NetworkFlow().Src().Raw()...)
	}

	log.Println("sourceToOurIP:", common.SourceToOurIP)
	log.Println("destinationFromOurIP:", common.DestinationFromOurIP)
	log.Println("sourceToOurIPEMA:", common.SourceToOurIPEMA)
	log.Println("destinationFromOurIPEMA:", common.DestinationFromOurIPEMA)

	entropyValue := common.CalculateEntropy(srcIPs)
	log.Printf("Calculated entropy: %f", entropyValue)
	atomic.StoreInt64(&common.CurrentEntropyBits, int64(math.Float64bits(entropyValue)))
	atomic.StoreInt32(&common.CurrentEntropyAvailable, 1)

	log.Printf("CPU Usage: %f", receivedData.CpuUsage)
	log.Printf("Memory Usage: %f", receivedData.MemoryUsage)
	log.Printf("Unique Source IPs: %d", receivedData.UniqueSrcIps)
	log.Printf("Unique Destination IPs: %d", receivedData.UniqueDstIps)
	log.Printf("Number of Hosts: %d", receivedData.NumHosts)
	log.Printf("Important Ports: %v", receivedData.ImportantPorts)

	sendDataToFrontend(
		receivedData.CpuUsage,
		receivedData.MemoryUsage,
		receivedData.UniqueSrcIps,
		receivedData.UniqueDstIps,
		receivedData.NumHosts,
		receivedData.ImportantPorts,
	)
}

func sendDataToFrontend(cpuUsage, memoryUsage float64, uniqueSrcIps, uniqueDstIps, numHosts int, ImportantPorts map[uint16]int) {
	data := map[string]interface{}{
		"sourceToOurIPEMA":        common.SourceToOurIPEMA,
		"destinationFromOurIPEMA": common.DestinationFromOurIPEMA,
		"topSourceIPs":            getTopTalkers(common.SourceToOurIP, 10),
		"topDestinationIPs":       getTopTalkers(common.DestinationFromOurIP, 10),
		"entropy":                 math.Float64frombits(uint64(atomic.LoadInt64(&common.CurrentEntropyBits))),
		"cpu_usage":               cpuUsage,
		"memory_usage":            memoryUsage,
		"unique_src_ips":          uniqueSrcIps,
		"unique_dst_ips":          uniqueDstIps,
		"num_hosts":               numHosts,
		"Important_ports":         getTopImportantPorts(ImportantPorts, 10),
	}

	log.Println("Data sent to frontend:", data)

	common.BroadcastData(data)
}

func getTopTalkers(data map[string]int, topN int) []string {
	type kv struct {
		Key   string
		Value int
	}

	var sortedData []kv
	for k, v := range data {
		sortedData = append(sortedData, kv{k, v})
	}

	sort.Slice(sortedData, func(i, j int) bool {
		return sortedData[i].Value > sortedData[j].Value
	})

	var topTalkers []string
	for i := 0; i < topN && i < len(sortedData); i++ {
		topTalkers = append(topTalkers, sortedData[i].Key)
	}

	return topTalkers
}

func getTopImportantPorts(data map[uint16]int, topN int) []string {
	type kv struct {
		Key   uint16
		Value int
	}

	var sortedData []kv
	for k, v := range data {
		sortedData = append(sortedData, kv{k, v})
	}

	sort.Slice(sortedData, func(i, j int) bool {
		return sortedData[i].Value > sortedData[j].Value
	})

	var topPorts []string
	for i := 0; i < topN && i < len(sortedData); i++ {
		topPorts = append(topPorts, fmt.Sprintf("Port %d: %d -> Source", sortedData[i].Key, sortedData[i].Value))
	}

	return topPorts
}
