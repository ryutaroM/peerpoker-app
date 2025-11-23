// src/lib/icons.ts
export const heroIcons = [
    // 剣士
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#FFD700"/>
    <rect x="42" y="50" width="16" height="25" fill="#4169E1"/>
    <rect x="35" y="55" width="10" height="3" fill="#FFD700"/>
    <rect x="55" y="55" width="10" height="3" fill="#FFD700"/>
    <rect x="45" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="50" y="75" width="5" height="15" fill="#8B4513"/>
    <path d="M 65 45 L 75 35 L 77 37 L 67 47 Z" fill="#C0C0C0"/>
  </svg>`,

    // 魔法使い
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#FFE4B5"/>
    <path d="M 45 20 L 50 10 L 55 20 Z" fill="#9370DB"/>
    <rect x="42" y="50" width="16" height="25" fill="#9370DB"/>
    <rect x="35" y="55" width="10" height="3" fill="#9370DB"/>
    <rect x="55" y="55" width="10" height="3" fill="#9370DB"/>
    <rect x="45" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="50" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="60" y="50" width="3" height="15" fill="#8B4513"/>
    <circle cx="61" cy="47" r="3" fill="#FFD700"/>
  </svg>`,

    // 戦士
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#D2691E"/>
    <rect x="40" y="28" width="20" height="8" fill="#696969"/>
    <rect x="42" y="50" width="16" height="25" fill="#DC143C"/>
    <rect x="35" y="55" width="10" height="3" fill="#696969"/>
    <rect x="55" y="55" width="10" height="3" fill="#696969"/>
    <rect x="45" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="50" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="30" y="55" width="8" height="15" fill="#696969"/>
  </svg>`,

    // 僧侶
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#FFE4B5"/>
    <rect x="42" y="50" width="16" height="25" fill="#FFFFFF"/>
    <rect x="47" y="50" width="6" height="25" fill="#FFD700"/>
    <rect x="35" y="55" width="10" height="3" fill="#FFFFFF"/>
    <rect x="55" y="55" width="10" height="3" fill="#FFFFFF"/>
    <rect x="45" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="50" y="75" width="5" height="15" fill="#8B4513"/>
    <path d="M 47 55 L 53 55 L 53 60 L 50 63 L 47 60 Z" fill="#FFD700"/>
  </svg>`,

    // 盗賊
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#FFE4B5"/>
    <path d="M 40 30 L 60 30 L 55 25 L 45 25 Z" fill="#2F4F4F"/>
    <rect x="42" y="50" width="16" height="25" fill="#2F4F4F"/>
    <rect x="35" y="55" width="10" height="3" fill="#8B4513"/>
    <rect x="55" y="55" width="10" height="3" fill="#8B4513"/>
    <rect x="45" y="75" width="5" height="15" fill="#8B4513"/>
    <rect x="50" y="75" width="5" height="15" fill="#8B4513"/>
    <circle cx="60" cy="55" r="2" fill="#FFD700"/>
    <circle cx="60" cy="60" r="2" fill="#FFD700"/>
  </svg>`,

    // 騎士
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="15" fill="#FFE4B5"/>
    <rect x="35" y="25" width="30" height="15" fill="#C0C0C0"/>
    <rect x="42" y="50" width="16" height="25" fill="#4682B4"/>
    <rect x="35" y="55" width="10" height="3" fill="#C0C0C0"/>
    <rect x="55" y="55" width="10" height="3" fill="#C0C0C0"/>
    <rect x="45" y="75" width="5" height="15" fill="#696969"/>
    <rect x="50" y="75" width="5" height="15" fill="#696969"/>
    <rect x="25" y="50" width="12" height="18" fill="#C0C0C0"/>
  </svg>`
];

export function getRandomHeroIcon(): string {
    return heroIcons[Math.floor(Math.random() * heroIcons.length)];
}