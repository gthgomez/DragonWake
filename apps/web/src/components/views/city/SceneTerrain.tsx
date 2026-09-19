/**
 * Authored settlement terrain for the Castle scene — North Star V2 §8.
 *
 * This is original vector art (canonical, not generated candidate art): one
 * continuous ground plane, defenses, circulation, cultivation and ambient
 * props, all sharing the settlement camera and warm upper-left key light.
 * It is presentation only and carries no game state.
 */
import { memo } from "react";

function Trees({
  x,
  y,
  s = 1,
  o = 1,
}: {
  x: number;
  y: number;
  s?: number;
  o?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="6" rx="13" ry="4" fill="rgba(0,0,0,.34)" />
      <path d="M0 6V-6" stroke="#3a2c1c" strokeWidth="2.4" />
      <path d="M-11-6 0-22 11-6Z" fill="#2f4026" />
      <path d="M-9-9 0-24 9-9Z" fill="#3d5230" />
      <path d="M-6-14 0-26 6-14Z" fill="#4a6238" />
      <path d="M-6-14 0-26 2-13Z" fill="rgba(210,190,140,.18)" />
    </g>
  );
}

function Rock({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="3" rx="14" ry="4" fill="rgba(0,0,0,.35)" />
      <path d="M-13 3-6-9 4-12 13 0 4 4Z" fill="#6b6659" />
      <path d="M-6-9 4-12 0-4Z" fill="#8a8474" />
      <path d="M-13 3-6-9 -4-2Z" fill="#4f4a40" />
    </g>
  );
}

function Cart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="5" rx="17" ry="4" fill="rgba(0,0,0,.32)" />
      <rect x="-14" y="-8" width="26" height="11" rx="2" fill="#5a4128" />
      <rect x="-14" y="-8" width="26" height="3" fill="#6f5233" />
      <circle cx="-9" cy="5" r="5" fill="none" stroke="#3b2c1c" strokeWidth="2.4" />
      <circle cx="8" cy="5" r="5" fill="none" stroke="#3b2c1c" strokeWidth="2.4" />
      <path d="M-15-4-24-9" stroke="#4a3a28" strokeWidth="2" />
    </g>
  );
}

function Barrels({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="4" rx="12" ry="3.4" fill="rgba(0,0,0,.3)" />
      <rect x="-9" y="-9" width="8" height="13" rx="2" fill="#6b4d2f" />
      <rect x="-9" y="-6" width="8" height="2" fill="#3f3a33" />
      <rect x="1" y="-7" width="7" height="11" rx="2" fill="#5c4228" />
      <rect x="1" y="-4.5" width="7" height="2" fill="#3f3a33" />
    </g>
  );
}

/** A short run of crenellated curtain wall with square towers, given
 *  isometric depth (front face + lit top face) so it sits in the ground
 *  plane rather than reading as a flat frontal ribbon. */
function WallRun({
  d,
  towers = [],
}: {
  d: string;
  towers?: { x: number; y: number }[];
}) {
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth="36" strokeLinecap="round" transform="translate(0 8)" />
      <path d={d} fill="none" stroke="#4b463a" strokeWidth="30" strokeLinecap="square" />
      <path d={d} fill="none" stroke="#7d7462" strokeWidth="25" strokeLinecap="square" />
      <path d={d} fill="none" stroke="#9a917c" strokeWidth="17" strokeLinecap="square" transform="translate(0 -8)" />
      <path d={d} fill="none" stroke="#625b4c" strokeWidth="25" strokeLinecap="square" strokeDasharray="8 8" strokeDashoffset="3" />
      <path d={d} fill="none" stroke="rgba(255,238,200,.2)" strokeWidth="2.5" strokeLinecap="square" transform="translate(-4 -13)" />
      {towers.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <ellipse cx="0" cy="18" rx="32" ry="10" fill="rgba(0,0,0,.45)" />
          <rect x="-26" y="-40" width="52" height="60" rx="3" fill="#6f6857" />
          <rect x="-26" y="-40" width="52" height="11" fill="#847c6a" />
          <path d="M-26-40h10v-11h10v11h12v-11h10v11h10v11h-52Z" fill="#9a917c" />
          <rect x="-8" y="-16" width="16" height="22" rx="2" fill="#2c251c" />
          <path d="M0-16v22" stroke="#5b5446" strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

export const SceneTerrain = memo(function SceneTerrain() {
  return (
    <svg
      className="castle-terrain"
      viewBox="0 0 1400 880"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d6a74" />
          <stop offset="42%" stopColor="#93867a" />
          <stop offset="70%" stopColor="#c2a878" />
          <stop offset="100%" stopColor="#d8bd8b" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.24" cy="0.16" r="0.6">
          <stop offset="0%" stopColor="rgba(255,226,168,.55)" />
          <stop offset="100%" stopColor="rgba(255,226,168,0)" />
        </radialGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#5c6a3d" />
          <stop offset="55%" stopColor="#4b5a33" />
          <stop offset="100%" stopColor="#3a4728" />
        </linearGradient>
        <linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d6656" />
          <stop offset="100%" stopColor="#39331f" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b7482" />
          <stop offset="100%" stopColor="#31434f" />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(196,186,160,0)" />
          <stop offset="55%" stopColor="rgba(198,184,152,.22)" />
          <stop offset="100%" stopColor="rgba(150,146,128,.4)" />
        </linearGradient>
        <pattern id="cobble" width="28" height="24" patternUnits="userSpaceOnUse">
          <rect width="28" height="24" fill="#7b7362" />
          <circle cx="7" cy="7" r="5" fill="#8a8271" />
          <circle cx="20" cy="10" r="5.5" fill="#847c6a" />
          <circle cx="13" cy="19" r="5" fill="#8f8776" />
          <circle cx="24" cy="2" r="3.6" fill="#88806e" />
          <circle cx="2" cy="20" r="3.6" fill="#807868" />
        </pattern>
        <filter id="grain" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.10  0 0 0 0 0.04  0 0 0 0.22 0" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <pattern id="paving" width="34" height="18" patternUnits="userSpaceOnUse" patternTransform="skewX(-32)">
          <rect width="34" height="18" fill="#7d7561" />
          <path d="M0 0h34M0 9h34" stroke="#5f5847" strokeWidth="1.6" />
          <path d="M17 0v18" stroke="#5f5847" strokeWidth="1.2" />
          <path d="M0 1.2h34" stroke="rgba(240,225,190,.16)" strokeWidth="1" />
        </pattern>
        <pattern id="field" width="46" height="22" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
          <rect width="46" height="22" fill="#8a7d4a" />
          <rect y="6" width="46" height="5" fill="#6f6437" />
          <rect y="16" width="46" height="3" fill="#9c8d55" />
        </pattern>
        <filter id="softLow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>

      {/* sky + sun */}
      <rect width="1400" height="880" fill="url(#sky)" />
      <rect width="1400" height="880" fill="url(#sunGlow)" />

      {/* distant ranges */}
      <path d="M0 250 150 150 300 220 430 120 560 210 700 130 850 205 1010 120 1160 200 1290 150 1400 210V300H0Z" fill="#6b7280" opacity=".5" />
      <path d="M0 300 120 232 260 292 380 214 520 288 660 226 820 292 980 224 1120 290 1260 236 1400 296V340H0Z" fill="#59616b" opacity=".55" />
      <path d="M0 340 160 300 320 344 470 296 640 346 800 300 960 348 1120 302 1280 346 1400 312V372H0Z" fill="#4c535c" opacity=".5" />

      {/* water / coast behind and beside the plateau */}
      <path d="M0 470C160 430 300 470 420 520 560 578 700 600 860 580 1020 560 1200 520 1400 560V880H0Z" fill="url(#water)" />
      <path d="M0 500C160 462 300 500 420 548 560 604 700 624 860 604 1020 584 1200 546 1400 584" fill="none" stroke="rgba(240,248,255,.25)" strokeWidth="3" />
      <path d="M180 640c40-10 70-6 110 6M980 660c50-12 90-6 140 6" stroke="rgba(240,248,255,.16)" strokeWidth="2.4" fill="none" />

      {/* atmospheric haze tying the island to the backdrop */}
      <rect x="0" y="250" width="1400" height="380" fill="url(#haze)" />

      {/* drop shadow the island casts onto the water — removes the float-plate read */}
      <ellipse cx="700" cy="700" rx="650" ry="230" fill="rgba(6,10,9,.5)" filter="url(#softLow)" />
      <ellipse cx="700" cy="770" rx="520" ry="120" fill="rgba(6,10,9,.4)" filter="url(#softLow)" />

      {/* plateau cliff base */}
      <path d="M40 330C120 250 300 196 520 184 770 170 1060 184 1236 238 1342 272 1382 350 1372 452 1360 584 1300 716 1172 792 1032 876 748 908 548 900 348 892 168 846 100 736 42 654 10 462 40 330Z" fill="url(#cliff)" />
      {/* cliff striations */}
      <g stroke="rgba(30,26,16,.4)" strokeWidth="2" fill="none">
        <path d="M120 360v300M210 300v420M330 260v520M470 232v560M650 220v580M840 226v560M1010 250v520M1150 300v440M1270 372v340" />
      </g>

      {/* plateau grass */}
      <path
        d="M84 330C160 264 330 214 535 202 770 190 1040 202 1206 252 1300 282 1336 350 1326 442 1316 560 1262 676 1146 744 1014 820 748 852 560 844 372 836 206 796 146 700 96 626 74 452 84 330Z"
        fill="url(#grass)"
        filter="url(#grain)"
      />
      {/* mottling: worn ground, dry grass and mud where people live */}
      <g opacity=".45">
        <ellipse cx="300" cy="430" rx="170" ry="78" fill="#3f4d2b" />
        <ellipse cx="880" cy="470" rx="200" ry="86" fill="#43512d" />
        <ellipse cx="640" cy="700" rx="210" ry="80" fill="#3c4827" />
        <ellipse cx="1080" cy="620" rx="150" ry="66" fill="#404d2b" />
        <ellipse cx="200" cy="620" rx="150" ry="60" fill="#46532f" />
      </g>
      <g opacity=".3">
        <ellipse cx="470" cy="560" rx="120" ry="42" fill="#6e6438" />
        <ellipse cx="800" cy="720" rx="130" ry="40" fill="#6a6036" />
        <ellipse cx="1010" cy="470" rx="90" ry="34" fill="#5f5834" />
      </g>

      {/* cultivated fields (front-left) */}
      <path d="M120 660q60-70 160-70t150 60q-70 66-176 62T120 660Z" fill="url(#field)" opacity=".85" />
      <path d="M120 660q60-70 160-70t150 60q-70 66-176 62T120 660Z" fill="none" stroke="#5d5530" strokeWidth="2" opacity=".6" />

      {/* approach roads */}
      <g fill="none" strokeLinecap="round">
        <path d="M620 806C598 716 566 638 540 560 522 500 516 446 518 404" stroke="rgba(0,0,0,.35)" strokeWidth="46" />
        <path d="M620 806C598 716 566 638 540 560 522 500 516 446 518 404" stroke="#9a8a66" strokeWidth="38" />
        <path d="M620 806C598 716 566 638 540 560 522 500 516 446 518 404" stroke="rgba(60,50,32,.32)" strokeWidth="30" strokeDasharray="3 12" />
        <path d="M556 626C460 620 340 612 220 626 170 632 140 642 118 656" stroke="rgba(0,0,0,.3)" strokeWidth="32" />
        <path d="M556 626C460 620 340 612 220 626 170 632 140 642 118 656" stroke="#93835f" strokeWidth="26" />
        <path d="M584 622C724 614 884 606 1024 612 1094 616 1154 626 1214 642" stroke="rgba(0,0,0,.3)" strokeWidth="32" />
        <path d="M584 622C724 614 884 606 1024 612 1094 616 1154 626 1214 642" stroke="#93835f" strokeWidth="26" />
        <path d="M872 520C920 486 960 450 998 414" stroke="#8d7d5a" strokeWidth="20" />
        <path d="M1008 420C986 496 906 560 820 602 762 630 700 642 640 648" stroke="rgba(0,0,0,.28)" strokeWidth="30" />
        <path d="M1008 420C986 496 906 560 820 602 762 630 700 642 640 648" stroke="#93835f" strokeWidth="24" />
      </g>

      {/* keep bailey plaza — cobbled, not square-tiled */}
      <ellipse cx="518" cy="372" rx="192" ry="102" fill="#6f6857" />
      <ellipse cx="518" cy="372" rx="188" ry="99" fill="url(#cobble)" opacity=".85" />
      <ellipse cx="518" cy="372" rx="196" ry="104" fill="none" stroke="rgba(30,24,14,.42)" strokeWidth="4" />
      {/* rise plaza for the Dragon Watch */}
      <ellipse cx="1008" cy="354" rx="150" ry="82" fill="#756d59" opacity=".8" />
      <ellipse cx="1008" cy="354" rx="146" ry="79" fill="url(#cobble)" opacity=".7" />

      {/* roost perch — the rise reads as a special place even with no dragon */}
      <g transform="translate(1112 356)">
        <ellipse cx="0" cy="12" rx="78" ry="26" fill="rgba(0,0,0,.38)" />
        <ellipse cx="0" cy="6" rx="68" ry="22" fill="#6d6656" />
        <ellipse cx="0" cy="1" rx="58" ry="17" fill="#948c78" />
        <path d="M-46 4-34-52-18-30-8-58 6-28 20-50 30-12 44 4Z" fill="#5f594b" />
        <path d="M-46 4-34-52-18-30-12-18-30 2Z" fill="#76705f" />
        <path d="M20-50 30-12 44 4 22 0Z" fill="#4c473b" />
        <path d="M-4 2c10-4 20-2 28 4" stroke="#e8dcc0" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
        <path d="M6 6c8 2 16 0 22-4" stroke="#e8dcc0" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".55" />
        <ellipse cx="-16" cy="6" rx="9" ry="6" fill="#cfc4a6" opacity=".8" />
      </g>

      {/* outer wall + gate */}
      <WallRun
        d="M120 688C260 764 460 808 664 808 868 808 1070 760 1210 682"
        towers={[
          { x: 120, y: 688 },
          { x: 452, y: 798 },
          { x: 664, y: 808 },
          { x: 876, y: 798 },
          { x: 1210, y: 682 },
        ]}
      />
      {/* gatehouse */}
      <g transform="translate(664 808)">
        <rect x="-34" y="-56" width="68" height="70" rx="3" fill="#8a8270" />
        <path d="M-34-56h12v-12h10v12h14v-12h10v12h14v-12h10v12h12v12h-68Z" fill="#9a9280" />
        <path d="M-18 14V-26a18 18 0 0 1 36 0v40Z" fill="#262019" />
        <path d="M0 14V-24" stroke="#4a4131" strokeWidth="2" />
      </g>

      {/* props */}
      <Trees x={150} y={430} s={1.15} />
      <Trees x={214} y={512} s={0.95} o={0.95} />
      <Trees x={1210} y={452} s={1.1} />
      <Trees x={1284} y={566} s={0.9} o={0.9} />
      <Trees x={1090} y={296} s={0.85} o={0.85} />
      <Trees x={700} y={252} s={0.8} o={0.8} />
      <Trees x={300} y={306} s={0.8} o={0.8} />
      <Trees x={1010} y={762} s={0.78} o={0.78} />
      <Trees x={176} y={706} s={0.82} o={0.82} />
      <Trees x={420} y={690} s={0.6} o={0.8} />
      <Trees x={540} y={770} s={0.55} o={0.75} />
      <Trees x={760} y={330} s={0.55} o={0.75} />
      <Trees x={940} y={720} s={0.6} o={0.8} />
      <Trees x={240} y={380} s={0.5} o={0.7} />
      <Trees x={1150} y={640} s={0.62} o={0.8} />
      <Trees x={620} y={300} s={0.5} o={0.7} />
      <Rock x={122} y={588} s={1.2} />
      <Rock x={1276} y={430} s={0.85} />
      <Rock x={1046} y={704} s={0.9} />
      <Rock x={470} y={322} s={0.8} />
      <Cart x={300} y={556} s={0.95} />
      <Barrels x={436} y={566} s={0.95} />
      <Barrels x={980} y={646} s={0.9} />
    </svg>
  );
});
