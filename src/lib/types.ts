export type PeerId = string;
export type Vote = number | string;

export type messageTypes =
	| 'join' // when a player joins the game
	| 'peer-joined' // when a peer notifies that they have joined
	| 'vote' // when a player votes for a porker
	| 'reveal' // when the votes are revealed
	| 'cancel' // when a player cancels their vote
	| 'reset' // when the game is reset
	| 'leave'; // when a player leaves the game

export interface Participant {
	name: string;
	vote?: Vote;
	hasVoted: boolean;
	icon?: string;
}

export interface Message {
	type: messageTypes;
	senderId: PeerId;
	timestamp: number;
	payload?: {
		name?: string;
		vote?: Vote;
		icon?: string;
		peerId?: PeerId;
	};
}

export interface GameState {
	participants: Map<PeerId, Participant>;
	isRevealed: boolean;
}
