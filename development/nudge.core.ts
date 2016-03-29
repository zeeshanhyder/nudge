/*
    sendResponse: function(responseData, client){
        responseData = JSON.stringify(responseData);
        client.send(responseData);
        console.log("Sent response: "+responseData);
    },
    parseMessage: function(data, client){
        var message = JSON.parse(data);
        if(message.payload == "REGISTER_CLIENT"){
            client._clientUID = message.from;
            this.addClient(client);
            var response = { from: "PROXY_SERVER", payload: this.getClients(), type: "SERVER_MSG" };
            this.sendResponse(response, client);
        }
    }
    
};

*/

//Broadcast Message Types
const REQ = 0; //broadcast requests something
const ACK = 1; //broadcast acknowledged the request
const COM = 2; //broadcast is commanding something
//Broadcast messages
const SERVER_REQUEST_BC = 1000;
const SERVER_ACK_BC = 1001;

function getDomain(IP):string {
    var d = "";
    d = IP.split(".");
    d = d[0] + "." + d[1] + "." + d[2]; //save first three splits of the ip    
    return d; //return it back
}


class Socialet{    
    private IS_WS_SERVER = false;
    private Domain = "";
    private BroadcastAddress = "";
    private Ports = {
        BroadcastServerPort: '',
        BroadcastClientPort: '',
        ServerPort: ''
    }
    private ServerIP = '';
    private BroadcastClient = {};
    private BroadcastServer = {};
    private Server = {};
    
    private SetServerFlag(bool){
      this.IS_WS_SERVER = bool;  
    }
    
   
    
    /*
    ** Log Object
    ** methods:
    ** I(message): Consoles success message
    ** W(message): Consoles warning message
    ** E(message): Consoles error message
    ** D(message): Consoles debug message (should not be used in production)
    */
    Log = {
        I: function(message){
            console.log(colors.cyan("INFO: "+message));
        },
        E: function(message){
            console.log(colors.red("ERROR: "+message));
        },
        W: function(message){
            console.log(colors.yellow("WARN: "+message));
        },
        D: function(message){
            console.log(colors.magenta("DEBUG: "+message));
        }
    }
    
    
    
    
    MessageHandler = {
        SendBroadcastMessage: (message,type)=>{
            var b_msg = {
                type: type,
                message: message
            }
            b_msg = JSON.stringify(b_msg);
            b_msg = new Buffer(b_msg);
            this.BroadcastClient.send( b_msg, 0, b_msg.length, this.Ports.BroadcastServerPort, this.BroadcastAddress);
        },

        ParseBroadcastMessage : (message,sender)=>{
            b_msg = JSON.parse(message);
            if(b_msg.message === SERVER_REQUEST_BC && this.IS_WS_SERVER === true && this.ServerIP !== sender.address){
                this.MessageHandler.SendBroadcastMessage(SERVER_ACK_BC,ACK) //send i'm the server
            }
        }
    }
     
    
    /*
    ** Client Handler Object
    ** Methods:
    ** AddClient(client): adds a client
    ** RemoveClient(client): removes a client from array
    ** GetAllClients(): returns all clients.
    ** GetClient(id): returns a specific client based on id.
    ** Clients[]: an array containing all the clients.
    
    ** Implement caching later on
    */
    
    ClientHandler = {
        
        Clients: [],
        AddClient: function(uid, client){
            var clientObj = {}
            this.Clients.forEach(function(currentClient,index){ 
               if(currentClient.resource.address == client.address) {
                this.Clients.splice(index,1);
                return;
               } 
            });
            clientObj.uid = uid;
            clientObj.resource = client;
            this.Clients.push(clientObj);
            return { uid: uid}
        },
       

        RemoveClient: function(client){
            var selectedClient = "";
             this.Clients.forEach(function(currentClient,index){ 
                if(currentClient.resource.address == client.address) {
                    selectedClientUID = currentClient.uid;
                    this.Clients.splice(index,1)}
            });
            return { uid: selectedClientUID }
        },
        
        
        GetClient: function(uid){
            this.Clients.forEach(function(currentClient, index){
                if(currentClient.uid === uid)
                    return currentClient.resource;
            });
            return {};
        },
        
        GetAllClients: function(){
            var clientList = [];
            this.Clients.forEach(function(client){
               clientList.push(client.uid); 
            });
            return clientList;
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // set the ports and IP configuration for server
    constructor(configuration: Object){
        this.ServerIP = configuration.IP;
        this.Ports.BroadcastServerPort = configuration.BroadcastServerPort;
        this.Ports.BroadcastClientPort = configuration.BroadcastClientPort;
        this.Ports.ServerPort = configuration.ServerPort;
        this.Domain = getDomain(this.ServerIP);
        this.BroadcastAddress = this.Domain+".255";
    
    }
    
    
     public CreateBroadcastClient( port:string ){
        this.BroadcastClient = DGRAM.createSocket("udp4");
        this.BroadcastClient.on("listening",()=>{
            this.BroadcastClient.setBroadcast(true);
            this.Log.I("Broadcast Client running on port: "+port);
            
            
            //Send first broadcast to make yourself known on the network.
            this.MessageHandler.SendBroadcastMessage(SERVER_REQUEST_BC,REQ);
            
        });
        this.BroadcastClient.bind(port);
    }
    
    public CreateBroadcastServer( port:string ){
        this.BroadcastServer = DGRAM.createSocket("udp4");
        this.BroadcastServer.on("listening", ()=>{
            this.Log.I("Broadcast Server running on port: "+port);
            
            //Fire up Broadcast Client to listen to broadcast events
            this.CreateBroadcastClient(this.Ports.BroadcastClientPort);
        });
        this.BroadcastServer.bind(port);
        this.BroadcastServer.on("message", (message,sender)=>{
            this.MessageHandler.ParseBroadcastMessage(message,sender);
        });
    }    

    
    public createServer(){
        this.Server = new WebSocketServer({ host: this.ServerIP, port: this.Ports.ServerPort}, ()=> {
            
            this.Log.I("Websockets Server started at: "+this.ServerIP+":"+this.Ports.ServerPort);
            
            // Set Server flag
            this.SetServerFlag(true);
            
            //Now, fire up the second step of our app, which is to create broadcast server.
            this.CreateBroadcastServer(this.Ports.BroadcastServerPort);
        });
        
        this.Server.on("connection", function(client){
            this.ClientHandler.AddNewClient(client);
        });
        this.Server.on("message",function(message){
            this.MessageHandler.ParseServerMessage(message);
        })
        
        this.Server.on("error", function(err){
            ErrorHandler(err);
        })
        this.Server.on("close", function(){
                this.Log.W("Shutting down Websockets Server");
        });
        return this.Server; 
    }    
    
}