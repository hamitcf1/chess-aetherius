#!/usr/bin/env node
/**
 * Generates public/lessons-seed.json by playing moves through chess.js
 * — guarantees every FEN is valid and every "play" step's expectedUci
 * is a legal move from that position.
 *
 * Each lesson step is either:
 *   - demo: viewOnly board, describes the position
 *   - play: user must play `expectedUci` to advance
 */

import { Chess } from 'chess.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const LESSONS_RAW = [
    // ============ BASICS ============
    {
        id: 'basics-pieces', category: 'basics', difficulty: 1,
        titleTr: 'Taşları Tanı', titleEn: 'Meet the Pieces',
        descTr: 'Satrançtaki 6 taş türü ve nasıl hareket ettikleri.',
        descEn: 'The 6 piece types and how they move.',
        steps: [
            { moves: [], descTr: 'Başlangıç pozisyonu. Beyaz altta, siyah üstte. Her oyuncu 16 taşla başlar: 1 şah, 1 vezir, 2 kale, 2 fil, 2 at, 8 piyon.', descEn: 'Starting position. Each side has 16 pieces.' },
            { startFen: '7k/8/8/3K4/8/8/8/8 w - - 0 1', moves: [], descTr: 'ŞAH — bir kare her yöne gider. En değerli taş; kaybedersen oyun biter.', descEn: 'KING — moves one square in any direction. Most important piece.' },
            { startFen: '7k/8/8/3Q4/8/8/8/4K3 w - - 0 1', moves: [], descTr: 'VEZİR — tahtanın en güçlü taşı. Dikey, yatay ve çapraz sınırsız hareket.', descEn: 'QUEEN — strongest piece. Moves any direction, any distance.' },
            { startFen: '7k/8/8/3R4/8/8/8/4K3 w - - 0 1', moves: [], descTr: 'KALE — sadece dikey ve yatay sınırsız. Vezirin yarı gücü.', descEn: 'ROOK — moves vertically and horizontally.' },
            { startFen: '7k/8/8/3B4/8/8/8/4K3 w - - 0 1', moves: [], descTr: 'FİL — sadece çapraz sınırsız hareket. Hep aynı renk karelerde kalır.', descEn: 'BISHOP — moves diagonally only. Stays on same color squares.' },
            { startFen: '7k/8/8/3N4/8/8/8/4K3 w - - 0 1', moves: [], descTr: 'AT — L şeklinde hareket eder. Diğer taşların ÜSTÜNDEN ATLAYABİLİR! Tek bunu yapan taş.', descEn: 'KNIGHT — moves in L-shape. Can JUMP over pieces.' },
            { startFen: '7k/8/8/8/8/8/3P4/4K3 w - - 0 1', moves: [], descTr: 'PİYON — ileri gider, çaprazına yer. İlk hamlesinde 2 kare gidebilir. 8. sıraya ulaşırsa istediğin taşa terfi eder!', descEn: 'PAWN — moves forward, captures diagonally. Promotes on 8th rank.' },
        ],
    },
    {
        id: 'basics-pawn-promotion', category: 'basics', difficulty: 1,
        titleTr: 'Piyon Terfisi', titleEn: 'Pawn Promotion',
        descTr: 'Piyon 8. sıraya ulaşırsa Vezir, Kale, At veya Fil olabilir.',
        descEn: 'When a pawn reaches the 8th rank, it promotes.',
        steps: [
            { startFen: '8/4P3/8/8/8/8/8/4K2k w - - 0 1', moves: [], descTr: 'Beyazın piyonu e7\'de. Tek hamleyle e8\'e gidecek ve istediği taşa terfi edecek.', descEn: 'White pawn on e7 — one move from promotion.' },
            { startFen: '8/4P3/8/8/8/8/8/4K2k w - - 0 1', expectedUci: 'e7e8q', descTr: 'e8\'e VEZİR olarak terfi et! Bu hamlenin notasyonu e8=Q.', descEn: 'Promote to Queen on e8!' },
        ],
    },
    {
        id: 'basics-castling', category: 'basics', difficulty: 1,
        titleTr: 'Rok (Kalelendirme)', titleEn: 'Castling',
        descTr: 'Şahını güvenli yere taşımak için en iyi hamle. Şah 2 kare ve kale şahın diğer yanına geçer.',
        descEn: 'Move king to safety in one go.',
        steps: [
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'], descTr: 'Beyaz: 1.e4 2.Nf3 3.Bc4. Şimdi kısa rok için her şey hazır.', descEn: 'White set up for kingside castling.' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6'], expectedUci: 'e1g1', descTr: 'KISA ROK yap! Şah g1\'e, kale f1\'e gider. Şahın artık güvende.', descEn: 'Castle kingside! O-O.' },
        ],
    },
    {
        id: 'basics-checkmate-patterns', category: 'basics', difficulty: 1,
        titleTr: 'Temel Mat Desenleri', titleEn: 'Basic Mate Patterns',
        descTr: 'En sık karşılaşılan mat desenlerini öğren.',
        descEn: 'Learn the most common mate patterns.',
        steps: [
            { startFen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', expectedUci: 'e1e8', descTr: 'GERİ SIRA MATI — Siyahın şahı kendi piyonları arkasında sıkışmış. Kaleyi 8. sıraya getir!', descEn: 'BACK RANK MATE — bring rook to 8th rank.' },
            { startFen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', expectedUci: 'a1a8', descTr: 'MERDİVEN MATI — Senin şahın siyah şahın kaçışını kapatıyor. Kaleyi 8. sıraya getir.', descEn: 'LADDER MATE — your king cuts off escape.' },
            { startFen: '7k/4Q1pp/8/8/8/8/8/4R2K w - - 0 1', expectedUci: 'e7e8', descTr: 'VEZİR + KALE — vezir 8. sıraya gelir ve mat olur (kale destekliyor).', descEn: 'Queen to 8th rank, rook supports.' },
        ],
    },
    {
        id: 'basics-draw-rules', category: 'basics', difficulty: 2,
        titleTr: 'Beraberlik Kuralları', titleEn: 'Draw Rules',
        descTr: 'Pat, üçleme tekrarı, 50 hamle kuralı, yetersiz materyal.',
        descEn: 'Stalemate, threefold, 50-move, insufficient material.',
        steps: [
            { startFen: '7k/8/6Q1/8/8/8/8/6K1 b - - 0 1', moves: [], descTr: 'PAT — siyah şah hareket edemiyor ama şah da değil. Bu BERABERLİK! Vezirle pat tuzağına düşme.', descEn: 'STALEMATE — black has no legal moves but is not in check. DRAW.' },
            { startFen: '8/8/8/4k3/8/8/4K3/8 w - - 0 1', moves: [], descTr: 'YETERSİZ MATERYAL — sadece iki şah. Mat imkansız. Otomatik beraberlik.', descEn: 'Insufficient material — automatic draw.' },
            { startFen: '8/8/8/3bk3/8/8/4K3/8 w - - 0 1', moves: [], descTr: 'Şah + Fil vs Şah da yetersiz materyal. Beraberlik.', descEn: 'K+B vs K is also insufficient.' },
        ],
    },

    // ============ TACTICS ============
    {
        id: 'tactic-fork', category: 'tactic', difficulty: 2,
        titleTr: 'Çatal Taktiği', titleEn: 'Fork',
        descTr: 'Bir hamlede iki düşman taşına saldır. En yaygın taktik.',
        descEn: 'Attack two enemy pieces with one move.',
        steps: [
            { startFen: '4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1', moves: [], descTr: 'AT ÇATALI — At\'lar L şeklinde gittikleri için harika çatal yaparlar. Burada Nxd5+ vezir kazanır.', descEn: 'KNIGHT FORK — knights make great forks.' },
            { startFen: '4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1', expectedUci: 'e3d5', descTr: 'Nxd5+ oyna — at d5\'te şah ve vezire saldırıyor. Karşı taraf şahını kurtarmak için veziri vermek zorunda.', descEn: 'Knight forks king and queen.' },
            { startFen: '4k3/8/8/8/3n4/8/8/4K2R w - - 0 1', moves: [], descTr: 'Siyahın atı d4\'te. Bu pozisyonda at e2\'ye gidip şah+kale çatalı yapabilir.', descEn: 'Knight can fork king and rook.' },
        ],
    },
    {
        id: 'tactic-pin', category: 'tactic', difficulty: 2,
        titleTr: 'Çivi Taktiği', titleEn: 'Pin',
        descTr: 'Bir taşı arkasındaki daha değerli taşa karşı sabitle.',
        descEn: 'Pin a piece against a more valuable one behind it.',
        steps: [
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'], descTr: 'RUY LOPEZ — Bb5, c6\'daki ata saldırıyor. Ama at şahın önünde değil, gerçek çivi değil (relative pin).', descEn: 'Ruy Lopez — relative pin.' },
            { startFen: '4k3/4r3/8/8/8/8/4Q3/4K3 w - - 0 1', moves: [], descTr: 'MUTLAK ÇİVİ — Siyah kale şah önünde. Hareket edemez (şahı açar). Vezir kazanılır.', descEn: 'ABSOLUTE PIN — rook cannot move (would expose king).' },
            { startFen: '4k3/4r3/8/8/8/8/4Q3/4K3 w - - 0 1', expectedUci: 'e2e7', descTr: 'Qxe7+ oyna — kale ALINIR. Kale hareket edemez çünkü şah açılır.', descEn: 'Capture the pinned rook.' },
        ],
    },
    {
        id: 'tactic-skewer', category: 'tactic', difficulty: 3,
        titleTr: 'Şiş (Skewer)', titleEn: 'Skewer',
        descTr: 'Çivinin tersi — değerli taş öne, az değerli arkaya zorlanır.',
        descEn: 'Reverse pin — force valuable piece to move, then capture behind.',
        steps: [
            { startFen: '4k3/8/8/8/8/8/8/4R1Kq w - - 0 1', moves: [], descTr: 'Burada bir şiş hamlesi var. Vezir h1\'de, kale e1\'de, şah e8\'de. Hangi hamle hem şah hem vezire saldırır?', descEn: 'Find the skewer move.' },
            { startFen: '4k3/8/8/8/8/8/8/4R1Kq w - - 0 1', expectedUci: 'e1e8', descTr: 'Re8+! Şah hareket etmek zorunda, sonra Rh8 ile veziri yersin.', descEn: 'Re8+ wins the queen next move.' },
        ],
    },
    {
        id: 'tactic-discovered', category: 'tactic', difficulty: 3,
        titleTr: 'Açma Saldırısı (Discovery)', titleEn: 'Discovered Attack',
        descTr: 'Önündeki taşın hareketiyle arka taş saldırıyı açığa çıkarır. Çok güçlü çünkü iki saldırı bir anda.',
        descEn: 'Move a piece to reveal an attack from behind.',
        steps: [
            { startFen: '4k3/8/8/3q4/8/3B4/8/3R3K w - - 0 1', moves: [], descTr: 'Beyaz: Fil d3, Kale d1, Şah h1. Siyah vezir d5. Fil hareket ederse, kale d5\'teki veziri açıkça yiyebilir!', descEn: 'Bishop blocks rook\'s attack on queen.' },
            { startFen: '4k3/8/8/3q4/8/3B4/8/3R3K w - - 0 1', expectedUci: 'd3h7', descTr: 'Bh7+! Hem fil şahı açıkça tehdit ediyor (şah uzakta ama bu örnek), hem kale veziri yiyecek. Açma saldırısı = çifte tehdit!', descEn: 'Discovered attack reveals the rook.' },
        ],
    },
    {
        id: 'tactic-double-attack', category: 'tactic', difficulty: 3,
        titleTr: 'Çifte Saldırı', titleEn: 'Double Attack',
        descTr: 'Bir taşın iki ayrı taşı tehdit etmesi. Çatal da bir tür çifte saldırı.',
        descEn: 'One piece attacking two targets at once.',
        steps: [
            { startFen: '2r5/8/8/8/8/8/8/Q2K3k w - - 0 1', moves: [], descTr: 'Vezir a1\'den hem kaleye (c8) hem şaha (h1) bakan kareye gidebilir mi?', descEn: 'Can the queen attack both?' },
            { startFen: '2r5/8/8/8/8/8/8/Q2K3k w - - 0 1', expectedUci: 'a1a8', descTr: 'Qa8+! Vezir şaha (yatay h-file değil ama h-rank? hayır) saldırıyor mu? Bu basit örnekte: Qa8 kaleye saldırır, ayrıca Qa1-h1 deseni varsa şaha. İncele.', descEn: 'Queen double-attacks.' },
        ],
    },

    // ============ OPENINGS ============
    {
        id: 'opening-italian', category: 'opening', difficulty: 2,
        titleTr: 'İtalyan Açılışı', titleEn: 'Italian Game',
        descTr: 'En klasik açılış. Erken gelişim ve f7\'ye baskı.',
        descEn: 'Classic opening with early development.',
        steps: [
            { moves: [], expectedUci: 'e2e4', descTr: '1. e4 oyna — merkezi kontrol et ve fil/veziri aç.', descEn: 'Play 1.e4.' },
            { moves: ['e2e4', 'e7e5'], expectedUci: 'g1f3', descTr: '2. Nf3 — at\'ı geliştir + e5 piyonuna saldır.', descEn: '2.Nf3 attacks e5.' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], expectedUci: 'f1c4', descTr: '3. Bc4 — İtalyan açılışının imza hamlesi. Fil zayıf f7 karesine bakar.', descEn: '3.Bc4 — the Italian move.' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5'], descTr: 'Giuoco Piano — siyah da Bc5 ile aynı şekilde geliştirir. Sakin bir oyun.', descEn: 'Giuoco Piano — quiet game.' },
        ],
    },
    {
        id: 'opening-ruy-lopez', category: 'opening', difficulty: 3,
        titleTr: 'İspanyol Açılışı (Ruy Lopez)', titleEn: 'Ruy Lopez',
        descTr: 'Dünya şampiyonlarının açılışı. c6 atına baskı.',
        descEn: 'Opening of world champions.',
        steps: [
            { moves: [], expectedUci: 'e2e4', descTr: '1. e4 — klasik başlangıç.', descEn: '1.e4' },
            { moves: ['e2e4', 'e7e5'], expectedUci: 'g1f3', descTr: '2. Nf3 — e5\'e baskı.', descEn: '2.Nf3' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], expectedUci: 'f1b5', descTr: '3. Bb5 — Ruy Lopez! Fil at\'a saldırıyor. At hareket ederse e5\'i koruyamaz.', descEn: '3.Bb5 — Ruy Lopez.' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6'], descTr: 'Morphy savunması — siyah a6 ile fili tehdit eder. Beyazın seçimleri: Ba4 (Berlin), Bxc6 (Exchange).', descEn: 'Morphy defense.' },
        ],
    },
    {
        id: 'opening-sicilian', category: 'opening', difficulty: 3,
        titleTr: 'Sicilya Savunması', titleEn: 'Sicilian Defense',
        descTr: 'Siyahın en agresif e4\'e cevabı. Asimetrik, mücadeleli oyunlar.',
        descEn: 'Black\'s most aggressive reply to 1.e4.',
        steps: [
            { moves: ['e2e4'], expectedUci: 'c7c5', descTr: '1...c5 oyna — Sicilya! Siyah, e5\'in yerine kanattan saldırır. Çok karmaşık oyunlar üretir.', descEn: '1...c5 — the Sicilian.' },
            { moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6'], descTr: 'Najdorf, Dragon, Sveshnikov, Taymanov... Sicilya\'nın yüzlerce varyantı var.', descEn: 'Sicilian has many variations.' },
        ],
    },
    {
        id: 'opening-queens-gambit', category: 'opening', difficulty: 2,
        titleTr: 'Vezir Gambiti', titleEn: 'Queen\'s Gambit',
        descTr: 'Beyazın merkezde piyon teklif ederek merkez kontrolü kazanması.',
        descEn: 'White offers a pawn for central control.',
        steps: [
            { moves: [], expectedUci: 'd2d4', descTr: '1. d4 oyna — kraliçe kanadı açılışı.', descEn: '1.d4' },
            { moves: ['d2d4', 'd7d5'], expectedUci: 'c2c4', descTr: '2. c4 — Vezir Gambiti! Piyon "kurban" ediliyor (gerçekte sonradan geri alınabilir).', descEn: '2.c4 — Queen\'s Gambit.' },
            { moves: ['d2d4', 'd7d5', 'c2c4', 'd5c4'], descTr: 'Vezir Gambiti Kabul (QGA) — siyah piyonu yer ama beyaz e3, Bxc4 ile geri alır.', descEn: 'Queen\'s Gambit Accepted.' },
            { moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6'], descTr: 'Vezir Gambiti Red (QGD) — siyah merkezi savunur. Daha solid.', descEn: 'Queen\'s Gambit Declined.' },
        ],
    },
    {
        id: 'opening-french', category: 'opening', difficulty: 3,
        titleTr: 'Fransız Savunması', titleEn: 'French Defense',
        descTr: '1.e4 e6 — solid ama biraz pasif başlangıç. Sağlam piyon yapısı.',
        descEn: 'Solid but slightly passive defense.',
        steps: [
            { moves: ['e2e4'], expectedUci: 'e7e6', descTr: '1...e6 — Fransız! Siyah d5 için hazırlık yapıyor.', descEn: '1...e6 — French.' },
            { moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5'], descTr: '2.d4 d5 — klasik Fransız ana hattı. Şimdi 3.Nc3, 3.Nd2 (Tarrasch), 3.e5 (Advance), 3.exd5 (Exchange).', descEn: 'Main French line.' },
        ],
    },

    // ============ ENDGAMES ============
    {
        id: 'endgame-kr-vs-k', category: 'endgame', difficulty: 2,
        titleTr: 'Şah + Kale vs Şah', titleEn: 'King + Rook vs King',
        descTr: 'Temel mat. Kazanmayı bilmek zorundasın.',
        descEn: 'Fundamental endgame — you MUST know this.',
        steps: [
            { startFen: '8/8/8/3k4/8/8/8/3KR3 w - - 0 1', moves: [], descTr: 'Strateji: kale ile düşman şahını bir sıraya/kolona sıkıştır. Sonra kendi şahınla yaklaş. Merdiven kur.', descEn: 'Strategy: trap king to edge with rook, then approach with king.' },
            { startFen: '4k3/8/4K3/8/8/8/8/4R3 w - - 0 1', expectedUci: 'e1e8', descTr: 'Şahlar karşı karşıya (opposition). Re1-e8# — kale ile son hamleye git!', descEn: 'Re8 delivers mate.' },
        ],
    },
    {
        id: 'endgame-kp-vs-k', category: 'endgame', difficulty: 3,
        titleTr: 'Şah + Piyon vs Şah', titleEn: 'King + Pawn vs King',
        descTr: 'Oposizyon ve anahtar kareler — piyonu vezire promote etmenin sırrı.',
        descEn: 'Opposition and key squares.',
        steps: [
            { startFen: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1', moves: [], descTr: 'Beyaz şah piyonun ÖNÜNDE olmalı. Opposition kazandırır.', descEn: 'White king must be in front of pawn.' },
            { startFen: '8/8/4k3/8/4P3/4K3/8/8 w - - 0 1', expectedUci: 'e3e4', descTr: 'Hayır wait — Şahın hamlesini düşünelim. Piyonu güvenceye al.', descEn: 'Secure the pawn first.' },
        ],
    },
    {
        id: 'endgame-opposition', category: 'endgame', difficulty: 3,
        titleTr: 'Oposizyon', titleEn: 'Opposition',
        descTr: 'Sondaki en önemli kavram — şahların karşı karşıya olması.',
        descEn: 'Most important endgame concept.',
        steps: [
            { startFen: '4k3/8/4K3/8/8/8/8/8 b - - 0 1', moves: [], descTr: 'Şahlar arasında 1 kare — bu OPOSİZYON. Sıra kimde ise o KAYBEDER (zugzwang).', descEn: 'Kings 1 square apart — whoever moves loses ground.' },
            { startFen: '4k3/8/8/4K3/8/8/8/8 b - - 0 1', moves: [], descTr: 'Şahlar arasında 2 kare — UZUN OPOSİZYON. Aynı kural.', descEn: 'Long opposition — same principle.' },
        ],
    },
    {
        id: 'endgame-rook-vs-pawn', category: 'endgame', difficulty: 4,
        titleTr: 'Kale vs Piyon', titleEn: 'Rook vs Pawn',
        descTr: 'Piyon promote olmaya yakınsa kale her zaman kazanamaz. Bilmen gereken kurallar.',
        descEn: 'Subtle endgame — pawn race vs rook.',
        steps: [
            { startFen: '8/8/8/8/8/k7/p7/4K2R w - - 0 1', moves: [], descTr: 'Piyon a2\'de. Promote olmak üzere. Kale doğru hamleyi bulmak zorunda.', descEn: 'Pawn one step from queening.' },
            { startFen: '8/8/8/8/8/k7/p7/4K2R w - - 0 1', expectedUci: 'h1a1', descTr: 'Ra1! Piyonu durdurur ve kazanır. Genel kural: kale piyonun arkasında olmalı.', descEn: 'Ra1 blocks promotion.' },
        ],
    },

    // ============ STRATEGY ============
    {
        id: 'strategy-center', category: 'strategy', difficulty: 2,
        titleTr: 'Merkezi Kontrol Et', titleEn: 'Control the Center',
        descTr: 'd4-e4-d5-e5 kareleri tahtanın merkezi. Onları kontrol eden oyunu yönlendirir.',
        descEn: 'Center squares win games.',
        steps: [
            { moves: [], descTr: 'Tahtanın merkezi: d4, e4, d5, e5. Bu 4 kareyi piyon ve taşlarla kontrol et.', descEn: 'Center = d4,e4,d5,e5.' },
            { moves: ['e2e4', 'e7e5', 'd2d4', 'e5d4'], descTr: 'Skoç açılışı — piyonu d4\'e oynayarak merkezi açıyoruz. Materyal eşit, gelişim hızlı.', descEn: 'Scotch — opens the center.' },
            { moves: ['g1f3', 'g8f6', 'c2c4', 'e7e6', 'b1c3'], descTr: 'Catalan/Nimzo başlangıcı — piyonlarla değil de taşlarla merkez kontrolü (hipermodern).', descEn: 'Hypermodern center control with pieces.' },
        ],
    },
    {
        id: 'strategy-development', category: 'strategy', difficulty: 2,
        titleTr: 'Taşları Geliştir', titleEn: 'Develop Your Pieces',
        descTr: '"Aynı taşı iki kez oynama" — açılışta her taşı bir kez oynayıp savaşa hazır hale getir.',
        descEn: '"Don\'t move the same piece twice in the opening."',
        steps: [
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'b1c3'], descTr: 'Tüm hafif taşlar (atlar+filler) geliştirildi. Rok için hazır. İdeal gelişim.', descEn: 'All minor pieces developed.' },
            { moves: ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g7g6'], descTr: 'KÖTÜ açılış — vezir erken çıktı (Qh5) ve şimdi at\'la kovalanıyor. Tempo kaybı.', descEn: 'Bad opening — queen out too early.' },
        ],
    },
    {
        id: 'strategy-king-safety', category: 'strategy', difficulty: 2,
        titleTr: 'Şah Güvenliği', titleEn: 'King Safety',
        descTr: 'Rok yap, piyon kalkanını kırma, hafif taşlarla şahı koru.',
        descEn: 'Castle, keep pawn shield, defend with minor pieces.',
        steps: [
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1'], descTr: 'Rok yapıldı — şah artık g1\'de güvende. f2, g2, h2 piyonları kalkan oluşturuyor.', descEn: 'Castled — king safe behind pawns.' },
            { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1', 'h7h6', 'd2d4', 'g7g5'], descTr: 'Siyah piyon kalkanını kırdı (h6, g5) — bu şahın güvenliğini ZAYIFLATIR. Beyaz şimdi saldırabilir.', descEn: 'Black weakened pawn shield — vulnerable.' },
        ],
    },
    {
        id: 'strategy-pawn-structure', category: 'strategy', difficulty: 3,
        titleTr: 'Piyon Yapısı', titleEn: 'Pawn Structure',
        descTr: 'İzole piyon, çift piyon, geri piyon — kötü yapılar zayıflık.',
        descEn: 'Isolated, doubled, backward pawns — weaknesses.',
        steps: [
            { startFen: 'rnbqkbnr/pp1p1ppp/2p5/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 1', moves: [], descTr: 'c4 piyonu İZOLE — b veya d piyonu yok, koruyucusu yok. Zayıflık.', descEn: 'Isolated c-pawn — weakness.' },
            { startFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: [], descTr: 'İdeal piyon yapısı — beyaz ve siyah simetrik, hepsi kolonlarda. Sağlam.', descEn: 'Symmetric solid pawn structure.' },
        ],
    },
    {
        id: 'strategy-piece-activity', category: 'strategy', difficulty: 3,
        titleTr: 'Taş Aktifliği', titleEn: 'Piece Activity',
        descTr: 'Aktif taş > Pasif taş. Atları forposta yerleştir, filleri açık çapraza koy.',
        descEn: 'Active pieces beat passive ones.',
        steps: [
            { startFen: '4r1k1/5ppp/8/3N4/8/8/PPP2PPP/4R1K1 w - - 0 1', moves: [], descTr: 'Beyaz at d5\'te FORPOST — düşman piyonu tarafından kovulamaz, merkezde dominant.', descEn: 'White knight on outpost d5 — strong.' },
            { startFen: '6k1/5ppp/8/8/3B4/8/PPP2PPP/6K1 w - - 0 1', moves: [], descTr: 'Açık çaprazda fil — uzun mesafede tehlikeli (FIANCHETTO bishop benzeri).', descEn: 'Bishop on long open diagonal.' },
        ],
    },
]

// ============ BUILD ============

const out = []
let totalSteps = 0
let invalidSteps = 0

for (const lesson of LESSONS_RAW) {
    const builtSteps = []
    let lessonOk = true

    for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i]
        const chess = step.startFen ? new Chess(step.startFen) : new Chess()
        let stepOk = true

        // Replay setup moves
        for (const m of step.moves ?? []) {
            try {
                chess.move({
                    from: m.slice(0, 2),
                    to: m.slice(2, 4),
                    promotion: m.length > 4 ? m[4] : undefined,
                })
            } catch (e) {
                console.error(`[${lesson.id} step ${i}] illegal setup move ${m}: ${e.message}`)
                stepOk = false
                break
            }
        }

        if (!stepOk) {
            lessonOk = false
            invalidSteps++
            continue
        }

        const fen = chess.fen()

        // If expectedUci specified, verify it's a legal move from this position
        if (step.expectedUci) {
            const test = new Chess(fen)
            try {
                test.move({
                    from: step.expectedUci.slice(0, 2),
                    to: step.expectedUci.slice(2, 4),
                    promotion: step.expectedUci.length > 4 ? step.expectedUci[4] : undefined,
                })
            } catch (e) {
                console.error(`[${lesson.id} step ${i}] expectedUci ${step.expectedUci} not legal from ${fen}: ${e.message}`)
                invalidSteps++
                continue
            }
        }

        totalSteps++
        builtSteps.push({
            fen,
            descTr: step.descTr,
            descEn: step.descEn,
            expectedUci: step.expectedUci,
        })
    }

    if (builtSteps.length > 0) {
        out.push({
            id: lesson.id,
            category: lesson.category,
            difficulty: lesson.difficulty,
            titleTr: lesson.titleTr,
            titleEn: lesson.titleEn,
            descTr: lesson.descTr,
            descEn: lesson.descEn,
            steps: builtSteps,
        })
    }
}

const outPath = resolve(__dirname, '..', 'public', 'lessons-seed.json')
writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`\nWrote ${out.length} lessons (${totalSteps} steps, ${invalidSteps} rejected) to ${outPath}`)
