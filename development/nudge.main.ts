(function(){
    
    var socialet = new Socialet({
        IP: IP.address(),
        BroadcastServerPort: "8001",
        BroadcastClientPort: "8000",
        ServerPort: "7086"
    });
    socialet.createServer();

})();