<script lang="ts">
	import { PeerWrapper } from '$lib/peer';
	import type { Message, Participant, PeerId } from '$lib/types';
	import { onMount, setContext } from 'svelte';
	import { getRandomHeroIcon } from '$lib/icons';

	let peerId = $state<string>('');
	let playerName = $state<string>('');
	let participants = $state<Map<PeerId, Participant>>(new Map());
	let isRevealed = $state<boolean>(false);
	let isConnected = $state<boolean>(false);
	let isConnecting = $state<boolean>(false);
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

		startGame: (name: string) => {
			playerName = name;
			const myIcon = getRandomHeroIcon();
			isConnected = false;
			isConnecting = true;

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
			peerWrapper.connectTo(opponentId);
		},

		vote: (value: string | number) => {
			const newParticipants = new Map(participants);
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
			const newParticipants = new Map(participants);
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
		isConnecting = false;
		isConnected = true;
	}

	function handleData(id: string, data: Message) {
		console.log(`Received data from ${id}:`, data);

		const newParticipants = new Map(participants);

		switch (data.type) {
			case 'join': {
				const participantId = data.senderId;
				if (!newParticipants.has(participantId)) {
					newParticipants.set(participantId, {
						name: data.payload?.name || 'Unknown',
						hasVoted: false,
						icon: data.payload?.icon
					});
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
		}

		participants = newParticipants;
	}

	function handlePeerConnected(id: string) {
		console.log(`Peer connected: ${id}`);

		if (peerWrapper) {
			participants.forEach((participant, participantId) => {
				const message: Message = {
					type: 'join',
					senderId: participantId,
					timestamp: Date.now(),
					payload: { name: participant.name, icon: participant.icon }
				};
				console.log(`Sending participant info to ${id}:`, message);
				peerWrapper!.sendTo(id, message);
			});
		}

		const newParticipants = new Map(participants);
		newParticipants.set(id, {
			name: 'Connecting...',
			hasVoted: false,
			icon: undefined
		});
		participants = newParticipants;
	}

	function handlePeerDisconnected(id: string) {
		console.log(`Peer disconnected: ${id}`);
		const newParticipants = new Map(participants);
		newParticipants.delete(id);
		participants = newParticipants;
	}

	onMount(() => {
		peerId = crypto.randomUUID();

		return () => {
			peerWrapper?.disconnect();
		};
	});

	let { children } = $props();
</script>

{@render children()}
