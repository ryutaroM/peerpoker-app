import type { Page } from '@playwright/test';

/** PeerJS が接続しにいくシグナリングサーバーの WebSocket URL。 */
const SIGNALING_SERVER = /peerpoker-signaling-server\.onrender\.com/;

/**
 * シグナリングサーバーの WebSocket をモックし、接続直後に OPEN を返す。
 * 外部サービスに依存せず「サーバー接続済み」状態のゲーム画面を検証できる。
 *
 * `page.goto()` より前に呼ぶこと。
 */
export async function mockSignalingServer(page: Page) {
	await page.routeWebSocket(SIGNALING_SERVER, (ws) => {
		// クライアントからの HEARTBEAT などは読み捨てる。
		ws.onMessage(() => {});
		ws.send(JSON.stringify({ type: 'OPEN' }));
	});
}

/** シグナリングサーバーへの接続が確立しないまま無応答になる状況を再現する。 */
export async function stallSignalingServer(page: Page) {
	await page.routeWebSocket(SIGNALING_SERVER, (ws) => {
		ws.onMessage(() => {});
	});
}

/**
 * ハイドレーションの完了を待つ。アイコンは onMount で割り当てられるため、
 * 表示されていればクライアント側のイベントハンドラも有効になっている。
 */
export async function waitForHydration(page: Page) {
	await page.locator('.icon-container svg').waitFor();
}

/** セットアップ画面で名前を設定する。 */
export async function setPlayerName(page: Page, name: string) {
	await waitForHydration(page);
	await page.locator('.player-icon').click();
	await page.getByRole('button', { name: /名前設定/ }).click();
	await page.getByLabel('名前').fill(name);
	await page.getByRole('button', { name: '保存' }).click();
}

/** 名前を設定し、サーバーに接続してゲーム画面まで進む。 */
export async function startGame(page: Page, name: string) {
	await setPlayerName(page, name);
	await page.locator('.player-icon').click();
	await page.getByRole('button', { name: /ゲーム開始/ }).click();
	await page.getByRole('button', { name: '接続開始' }).click();
	await page.getByRole('heading', { name: 'Your Estimate' }).waitFor();
}
