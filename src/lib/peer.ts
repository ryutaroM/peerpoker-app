import Peer, { DataConnection } from "peerjs";

export class PeerWrapper {
    private peer: Peer | null = null;
    private conns: Map<string, DataConnection> = new Map();

    constructor(
        private peerId: string,
        private onData: (peerId: string, data: any) => void,
        private onPeerConnected: (peerId: string) => void,
        private onPeerDisconnected: (peerId: string) => void
    ) { }

    public connect(): void {
        this.peer = new Peer(this.peerId, {
            host: 'your-peerjs-server.com',
            port: 9000,
            path: '/myapp'
        });

        this.peer.on("open", (id) => {
            console.log(`Peer connected with ID: ${id}`);
        });

        this.peer.on("connection", (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on("error", (e) => {
            console.error(`Peer error: ${e}`);
        });
    }

    public connectTo(peerId: string): void {
        if (!this.peer) return;

        const conn = this.peer.connect(peerId);

        this.setupConnection(conn);
    }

    private setupConnection(conn: DataConnection): void {
        conn.on("open", () => {
            console.log(`Connected to peer: ${conn.peer}`);
            this.conns.set(conn.peer, conn);
            this.onPeerConnected(conn.peer);
        })

        conn.on("data", (data) => {
            this.onData(conn.peer, data);
        });

        conn.on("close", () => {
            console.log(`Disconnected from peer: ${conn.peer}`);
            this.conns.delete(conn.peer);
            this.onPeerDisconnected(conn.peer);
        });

        conn.on("error", (e) => {
            console.error(`Connection error with peer ${conn.peer}: ${e}`);
        });
    }

    public broadcast(data: any): void {
        this.conns.forEach((conn) => {
            conn.send(data);
        })
    }

    public disconnect(): void {
        this.conns.forEach((conn) => {
            conn.close();
        });
        this.conns.clear();
        this.peer?.destroy();
    }

    public getPeerId(): string {
        return this.peerId;
    }
}