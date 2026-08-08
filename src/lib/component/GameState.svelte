<script lang="ts">
	import { PeerWrapper } from '$lib/peer';
	import type { Message, Participant, PeerId } from '$lib/types';
	import { onMount, setContext } from 'svelte';
	import { getRandomHeroIcon } from '$lib/icons';
	import { SvelteMap } from 'svelte/reactivity';

	let peerId = $state<string>('');
	let playerName = $state<string>('');
	let playerIcon = $state<string>('');
	let hasName = $state<boolean>(false);
	let participants: SvelteMap<PeerId, Participant> = new SvelteMap();
	let isRevealed = $state<boolean>(false);
	let isConnected = $state<boolean>(false);
	let isConnecting = $state<boolean>(false);
	let isConnectingToPeer = $state<boolean>(false);
	let isServerStarting = $state<boolean>(false);
	let connectionStartTime: number | null = null;
	let serverStartCheckTimer: ReturnType<typeof setTimeout> | null = null;
	let peerWrapper: PeerWrapper | null = null;

	const gameState = {
		get peerId() {
			return peerId;
		},
		get playerName() {
			return playerName;
		},
		set playerName(value: string) {
			playerName = value;
		},
		get playerIcon() {
			return playerIcon;
		},
		get hasName() {
			return hasName;
		},
		get participants() {
			return participants;
		},
		get isRevealed() {
			return isRevealed;
		},
		get isConnected() {
			return isConnected;
		},
		get isConnecting() {
			return isConnecting;
		},
		get isConnectingToPeer() {
			return isConnectingToPeer;
		},
		get isServerStarting() {
			return isServerStarting;
		},

		setPlayerName: (name: string) => {
			playerName = name;
			hasName = true;
		},

		connectToServer: () => {
			isConnected = false;
			isConnecting = true;
			isServerStarting = false;
			connectionStartTime = Date.now();

			// 5秒経過後にサーバー起動中状態にする
			if (serverStartCheckTimer) clearTimeout(serverStartCheckTimer);
			serverStartCheckTimer = setTimeout(() => {
				if (isConnecting && !isConnected) {
					isServerStarting = true;
				}
			}, 5000);

			peerWrapper = new PeerWrapper(
				peerId,
				handleData,
				handlePeerConnected,
				handlePeerDisconnected,
				handleServerConnected
			);
			peerWrapper.connect();

			participants.set(peerId, {
				name: playerName,
				hasVoted: false,
				icon: playerIcon
			});
		},

		startGame: (name: string) => {
			playerName = name;
			const myIcon = getRandomHeroIcon();
			isConnected = false;
			isConnecting = true;
			isServerStarting = false;
			connectionStartTime = Date.now();

			// 5秒経過後にサーバー起動中状態にする
			if (serverStartCheckTimer) clearTimeout(serverStartCheckTimer);
			serverStartCheckTimer = setTimeout(() => {
				if (isConnecting && !isConnected) {
					isServerStarting = true;
				}
			}, 5000);

			peerWrapper = new PeerWrapper(
				peerId,
				handleData,
				handlePeerConnected,
				handlePeerDisconnected,
				handleServerConnected
			);
			peerWrapper.connect();

			participants.set(peerId, {
				name: name,
				hasVoted: false,
				icon: myIcon
			});
		},

		connectToOpponent: (opponentId: string) => {
			if (!opponentId || !peerWrapper) return;
			isConnectingToPeer = true; // Start connecting to peer
			peerWrapper.connectTo(opponentId);
		},

		vote: (value: string | number) => {
			const newParticipants = new SvelteMap(participants);
			const me = newParticipants.get(peerId);
			if (me) {
				me.vote = value;
				me.hasVoted = true;
			}
			participants = newParticipants;

			const message: Message = {
				type: 'vote',
				senderId: peerId,
				timestamp: Date.now(),
				payload: { vote: value }
			};
			peerWrapper?.broadcast(message);
		},

		reveal: () => {
			isRevealed = true;
			const message: Message = {
				type: 'reveal',
				senderId: peerId,
				timestamp: Date.now()
			};
			peerWrapper?.broadcast(message);
		},

		reset: () => {
			const newParticipants = new SvelteMap(participants);
			newParticipants.forEach((participant) => {
				participant.vote = undefined;
				participant.hasVoted = false;
			});
			participants = newParticipants;
			isRevealed = false;

			const message: Message = {
				type: 'reset',
				senderId: peerId,
				timestamp: Date.now()
			};
			peerWrapper?.broadcast(message);
		}
	};

	setContext('gameState', gameState);

	function handleServerConnected() {
		console.log('Connected to server');
		if (serverStartCheckTimer) {
			clearTimeout(serverStartCheckTimer);
			serverStartCheckTimer = null;
		}
		isConnecting = false;
		isConnected = true;
		isServerStarting = false;

		if (connectionStartTime) {
			const connectionTime = Date.now() - connectionStartTime;
			console.log(`Connection established in ${connectionTime}ms`);
			connectionStartTime = null;
		}
	}

	function handleData(id: string, data: Message) {
		console.log(`Received data from ${id}:`, data);

		const newParticipants = new SvelteMap(participants);

		switch (data.type) {
			case 'join': {
				const participantId = data.senderId;
				if (!newParticipants.has(participantId)) {
					newParticipants.set(participantId, {
						name: data.payload?.name || 'Unknown',
						hasVoted: false,
						icon: data.payload?.icon
					});

					const myInfo = participants.get(peerId);
					if (myInfo && peerWrapper) {
						const myMessage: Message = {
							type: 'join',
							senderId: peerId,
							timestamp: Date.now(),
							payload: { name: myInfo.name, icon: myInfo.icon }
						};
						console.log(`Replying with my info to ${participantId}`);
						peerWrapper.sendTo(participantId, myMessage);
					}
				} else {
					const participant = newParticipants.get(participantId);
					if (participant && data.payload?.name) {
						participant.name = data.payload.name;
					}
					if (participant && data.payload?.icon) {
						participant.icon = data.payload.icon;
					}
				}
				break;
			}
			case 'peer-joined': {
				const newPeerId = data.payload?.peerId;
				if (newPeerId && newPeerId !== peerId && peerWrapper) {
					if (!participants.has(newPeerId)) {
						console.log(`Auto-connecting to new peer: ${newPeerId}`);
						peerWrapper.connectTo(newPeerId);
					} else {
						console.log(`Already connected to ${newPeerId}, skipping`);
					}
				}
				break;
			}
			case 'vote': {
				const participant = newParticipants.get(data.senderId);
				if (participant) {
					participant.vote = data.payload?.vote;
					participant.hasVoted = true;
				}
				break;
			}
			case 'reveal': {
				isRevealed = true;
				break;
			}
			case 'reset': {
				newParticipants.forEach((participant) => {
					participant.vote = undefined;
					participant.hasVoted = false;
				});
				isRevealed = false;
				break;
			}
			case 'leave': {
				if (data.senderId === id) {
					handlePeerDisconnected(data.senderId);
				}
				return;
			}
		}

		participants = newParticipants;
	}

	function handlePeerConnected(id: string) {
		console.log(`Peer connected: ${id}`);
		isConnectingToPeer = false; // Successfully connected to peer

		// ★ 新しいピアをローカルに追加（最初に）
		const newParticipants = new SvelteMap(participants);
		newParticipants.set(id, {
			name: 'Connecting...',
			hasVoted: false,
			icon: undefined
		});
		participants = newParticipants;

		if (peerWrapper) {
			// ★ 自分の情報だけを新しいピアに送信
			const myInfo = participants.get(peerId);
			if (myInfo) {
				const myMessage: Message = {
					type: 'join',
					senderId: peerId,
					timestamp: Date.now(),
					payload: { name: myInfo.name, icon: myInfo.icon }
				};
				console.log(`Sending my info to ${id}:`, myMessage);
				peerWrapper.sendTo(id, myMessage);
			}

			// ★ 既存のピアに新しいピアを通知（broadcastは問題ない）
			const newPeerMessage: Message = {
				type: 'peer-joined',
				senderId: peerId,
				timestamp: Date.now(),
				payload: { peerId: id }
			};
			console.log(`Notifying existing peers about new peer ${id}:`, newPeerMessage);
			peerWrapper.broadcast(newPeerMessage);
		}
	}

	function handlePeerDisconnected(id: string) {
		if (!participants.has(id)) return;
		console.log(`Peer disconnected: ${id}`);
		const newParticipants = new SvelteMap(participants);
		newParticipants.delete(id);
		participants = newParticipants;
	}

	function cleanupAndDisconnect() {
		if (!peerWrapper) return;

		const leaveMessage: Message = {
			type: 'leave',
			senderId: peerId,
			timestamp: Date.now()
		};
		peerWrapper.broadcast(leaveMessage);
		peerWrapper.disconnect();
		peerWrapper = null;
	}

	onMount(() => {
		peerId = crypto.randomUUID();
		playerIcon = getRandomHeroIcon();

		window.addEventListener('beforeunload', cleanupAndDisconnect);
		window.addEventListener('pagehide', cleanupAndDisconnect);

		return () => {
			window.removeEventListener('beforeunload', cleanupAndDisconnect);
			window.removeEventListener('pagehide', cleanupAndDisconnect);
			if (serverStartCheckTimer) {
				clearTimeout(serverStartCheckTimer);
			}
			cleanupAndDisconnect();
		};
	});

	let { children } = $props();
</script>

{@render children()}
