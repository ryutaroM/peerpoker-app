import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { Message } from './types';

export class PeerWrapper {
    private peer: Peer | null = null;
    private conns: Map<string, DataConnection> = new Map();

    constructor(
        private peerId: string,
        private onData: (peerId: string, data: Message) => void,
        private onPeerConnected: (peerId: string) => void,
        private onPeerDisconnected: (peerId: string) => void
    ) { }

    public connect(): void {
        this.peer = new Peer(this.peerId, {
            host: 'peerpoker-signaling-server.onrender.com',
            port: 443,
            path: '/myapp',
            secure: true
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
        console.log('connectTo called with peerId:', peerId);
        if (!this.peer) {
            console.log('this.peer is null, returning');
            return;
        }

        const conn = this.peer.connect(peerId);
        console.log('Created connection:', conn);

        // 接続がオープンするまで待つ
        if (conn.open) {
            console.log('Connection already open, setting up');
            this.setupConnection(conn);
        } else {
            console.log('Waiting for connection to open');
            conn.on('open', () => {
                console.log('Connection opened, setting up');
                this.setupConnection(conn);
            });
        }
    }

    private setupConnection(conn: DataConnection): void {
        console.log('setupConnection called for peer:', conn.peer);

        // 既に接続されている場合はすぐに処理
        if (conn.open) {
            console.log('Connection already open');
            this.conns.set(conn.peer, conn);
            this.onPeerConnected(conn.peer);
        } else {
            conn.on("open", () => {
                console.log(`Connected to peer: ${conn.peer}`);
                this.conns.set(conn.peer, conn);
                this.onPeerConnected(conn.peer);
            });
        }

        conn.on("data", (data: unknown) => {
            if (data && typeof data === 'object' && 'type' in data && 'senderId' in data) {
                this.onData(conn.peer, data as Message);
            } else {
                console.warn('Invalid message format:', data);
            }
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

    public broadcast(data: Message): void {
        this.conns.forEach((conn) => {
            conn.send(data);
        })
    }

    public sendTo(peerId: string, data: Message): void {
        const conn = this.conns.get(peerId);
        if (conn) {
            console.log(`Sending to ${peerId}:`, data);
            conn.send(data);
        } else {
            console.warn(`No connection found for peer: ${peerId}. Available connections:`, Array.from(this.conns.keys()));
        }
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