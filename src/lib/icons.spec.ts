import { describe, it, expect, vi, afterEach } from 'vitest';
import { heroIcons, getRandomHeroIcon } from './icons';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('heroIcons', () => {
	it('アイコンを 1 つ以上持つ', () => {
		expect(heroIcons.length).toBeGreaterThan(0);
	});

	it('すべて SVG マークアップである', () => {
		for (const icon of heroIcons) {
			expect(icon.trim().startsWith('<svg')).toBe(true);
			expect(icon.trim().endsWith('</svg>')).toBe(true);
			expect(icon).toContain('viewBox="0 0 100 100"');
		}
	});

	it('同じアイコンが重複していない', () => {
		expect(new Set(heroIcons).size).toBe(heroIcons.length);
	});
});

describe('getRandomHeroIcon', () => {
	it('heroIcons のいずれかを返す', () => {
		for (let i = 0; i < 50; i++) {
			expect(heroIcons).toContain(getRandomHeroIcon());
		}
	});

	it('乱数が 0 のとき先頭のアイコンを返す', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);

		expect(getRandomHeroIcon()).toBe(heroIcons[0]);
	});

	it('乱数が 1 に極めて近いとき末尾のアイコンを返す', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.9999999);

		expect(getRandomHeroIcon()).toBe(heroIcons[heroIcons.length - 1]);
	});

	it('乱数に応じて対応する位置のアイコンを返す', () => {
		const index = Math.floor(heroIcons.length / 2);
		vi.spyOn(Math, 'random').mockReturnValue(index / heroIcons.length);

		expect(getRandomHeroIcon()).toBe(heroIcons[index]);
	});
});
