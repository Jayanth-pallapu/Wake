"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   GAME EFFECTS LIBRARY — shared by all casino games
   All effects use pure CSS @keyframes + Framer Motion only.
═══════════════════════════════════════════════════════════════ */

/* ─── Global keyframes string (inject with <GameStyles/>) ─── */
export const GAME_KEYFRAMES = `
  @keyframes gfxParticle0  {0%{transform:rotate(0deg)   translateY(0)translateX(0);opacity:1}100%{transform:rotate(0deg)   translateY(-140px)translateX(30px);opacity:0}}
  @keyframes gfxParticle1  {0%{transform:rotate(18deg)  translateY(0)translateX(0);opacity:1}100%{transform:rotate(18deg)  translateY(-130px)translateX(-25px);opacity:0}}
  @keyframes gfxParticle2  {0%{transform:rotate(36deg)  translateY(0)translateX(0);opacity:1}100%{transform:rotate(36deg)  translateY(-115px)translateX(50px);opacity:0}}
  @keyframes gfxParticle3  {0%{transform:rotate(54deg)  translateY(0)translateX(0);opacity:1}100%{transform:rotate(54deg)  translateY(-90px) translateX(-45px);opacity:0}}
  @keyframes gfxParticle4  {0%{transform:rotate(72deg)  translateY(0)translateX(0);opacity:1}100%{transform:rotate(72deg)  translateY(-155px)translateX(10px);opacity:0}}
  @keyframes gfxParticle5  {0%{transform:rotate(90deg)  translateY(0)translateX(0);opacity:1}100%{transform:rotate(90deg)  translateY(-125px)translateX(-60px);opacity:0}}
  @keyframes gfxParticle6  {0%{transform:rotate(108deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(108deg) translateY(-105px)translateX(70px);opacity:0}}
  @keyframes gfxParticle7  {0%{transform:rotate(126deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(126deg) translateY(-138px)translateX(-30px);opacity:0}}
  @keyframes gfxParticle8  {0%{transform:rotate(144deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(144deg) translateY(-85px) translateX(55px);opacity:0}}
  @keyframes gfxParticle9  {0%{transform:rotate(162deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(162deg) translateY(-148px)translateX(-15px);opacity:0}}
  @keyframes gfxParticle10 {0%{transform:rotate(180deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(180deg) translateY(-128px)translateX(45px);opacity:0}}
  @keyframes gfxParticle11 {0%{transform:rotate(198deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(198deg) translateY(-98px) translateX(-50px);opacity:0}}
  @keyframes gfxParticle12 {0%{transform:rotate(216deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(216deg) translateY(-158px)translateX(25px);opacity:0}}
  @keyframes gfxParticle13 {0%{transform:rotate(234deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(234deg) translateY(-112px)translateX(-65px);opacity:0}}
  @keyframes gfxParticle14 {0%{transform:rotate(252deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(252deg) translateY(-133px)translateX(60px);opacity:0}}
  @keyframes gfxParticle15 {0%{transform:rotate(270deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(270deg) translateY(-103px)translateX(-35px);opacity:0}}
  @keyframes gfxParticle16 {0%{transform:rotate(288deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(288deg) translateY(-148px)translateX(18px);opacity:0}}
  @keyframes gfxParticle17 {0%{transform:rotate(306deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(306deg) translateY(-122px)translateX(-55px);opacity:0}}
  @keyframes gfxParticle18 {0%{transform:rotate(324deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(324deg) translateY(-88px) translateX(42px);opacity:0}}
  @keyframes gfxParticle19 {0%{transform:rotate(342deg) translateY(0)translateX(0);opacity:1}100%{transform:rotate(342deg) translateY(-143px)translateX(-28px);opacity:0}}
  @keyframes gfxPulseRing  {0%{transform:scale(0.5);opacity:0.9}100%{transform:scale(3);opacity:0}}
  @keyframes gfxShake      {0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}35%{transform:translateX(9px)}55%{transform:translateX(-7px)}75%{transform:translateX(7px)}90%{transform:translateX(-3px)}}
  @keyframes gfxFlame      {0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
  @keyframes gfxConfetti0  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(220px)rotate(520deg);opacity:0}}
  @keyframes gfxConfetti1  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(200px)rotate(-430deg);opacity:0}}
  @keyframes gfxConfetti2  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(240px)rotate(600deg);opacity:0}}
  @keyframes gfxConfetti3  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(190px)rotate(-550deg);opacity:0}}
  @keyframes gfxConfetti4  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(230px)rotate(480deg);opacity:0}}
  @keyframes gfxConfetti5  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(210px)rotate(-500deg);opacity:0}}
  @keyframes gfxConfetti6  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(250px)rotate(420deg);opacity:0}}
  @keyframes gfxConfetti7  {0%{transform:translateY(-20px)rotate(0deg);opacity:1}100%{transform:translateY(195px)rotate(-470deg);opacity:0}}
  @keyframes gfxSpotlight  {0%,100%{opacity:0.15}50%{opacity:0.32}}
  @keyframes gfxFloat      {0%,100%{transform:translateY(0px)}50%{transform:translateY(-7px)}}
  @keyframes gfxSpin       {0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @keyframes gfxPulse      {0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.05)}}
  @keyframes gfxRipple     {0%{transform:scale(0.8);opacity:0.8}100%{transform:scale(2);opacity:0}}
  @keyframes gfxSlideUp    {0%{transform:translateY(28px);opacity:0}60%{transform:translateY(-4px)}100%{transform:translateY(0);opacity:1}}
  @keyframes gfxGlow       {0%,100%{box-shadow:0 0 10px currentColor}50%{box-shadow:0 0 30px currentColor,0 0 60px currentColor}}
  @keyframes gfxCardFlip   {0%{transform:perspective(600px)rotateY(0deg)}100%{transform:perspective(600px)rotateY(180deg)}}
  @keyframes gfxBounce     {0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}70%{transform:translateY(-8px)}}
  @keyframes gfxFlicker    {0%,100%{opacity:1}45%{opacity:0.85}55%{opacity:0.95}75%{opacity:0.8}}
  @keyframes gfxWiggle     {0%,100%{transform:rotate(0deg)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
  @keyframes gfxExpand      {0%{transform:scale(0);opacity:0.8}100%{transform:scale(1.8);opacity:0}}
  @keyframes gfxCometTrail  {0%{opacity:0.8;transform:scaleX(1)}100%{opacity:0;transform:scaleX(0)}}
  @keyframes gfxRocketGlow  {0%,100%{filter:drop-shadow(0 0 6px #ff9a00) drop-shadow(0 0 12px #ff4e00)}50%{filter:drop-shadow(0 0 18px #ffd23f) drop-shadow(0 0 36px #ff9a00)}}
  @keyframes gfxDiceShake   {0%,100%{transform:translateX(0) rotateZ(0)}12%{transform:translateX(-8px) rotateZ(-4deg)}25%{transform:translateX(8px) rotateZ(4deg)}38%{transform:translateX(-6px) rotateZ(-3deg)}50%{transform:translateX(6px) rotateZ(3deg)}62%{transform:translateX(-4px) rotateZ(-2deg)}75%{transform:translateX(4px) rotateZ(2deg)}88%{transform:translateX(-2px) rotateZ(-1deg)}}
  @keyframes gfxDiceLand    {0%{transform:scale(1.18) translateY(-6px)}55%{transform:scale(0.93) translateY(2px)}80%{transform:scale(1.04) translateY(-1px)}100%{transform:scale(1) translateY(0)}}
  @keyframes gfxDiceFloat   {0%,100%{transform:translateY(0px) rotateY(0deg)}50%{transform:translateY(-8px) rotateY(6deg)}}
  @keyframes gfxDiceGlow    {0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.4),0 8px 32px rgba(0,0,0,0.6)}50%{box-shadow:0 0 40px rgba(168,85,247,0.8),0 12px 40px rgba(0,0,0,0.7)}}
  @keyframes gfxDiceWinGlow {0%{box-shadow:0 0 20px rgba(255,210,63,0.4),0 8px 32px rgba(0,0,0,0.6)}60%{box-shadow:0 0 60px rgba(255,210,63,0.9),0 0 100px rgba(255,210,63,0.4)}100%{box-shadow:0 0 30px rgba(255,210,63,0.6),0 8px 40px rgba(0,0,0,0.6)}}
  @keyframes gfxDiceLoseGlow{0%{box-shadow:0 0 20px rgba(255,68,68,0.4)}60%{box-shadow:0 0 55px rgba(255,68,68,0.85)}100%{box-shadow:0 0 25px rgba(255,68,68,0.4)}}
  @keyframes gfxWinZonePulse{0%{opacity:0.7}40%{opacity:1}70%{opacity:0.85}100%{opacity:0.7}}
  @keyframes gfxBarFill     {0%{width:0%}100%{width:var(--bar-w)}}
  @keyframes gfxResultDot   {0%{transform:translateX(-50%) scale(0.2);opacity:0}60%{transform:translateX(-50%) scale(1.3);opacity:1}80%{transform:translateX(-50%) scale(0.9)}100%{transform:translateX(-50%) scale(1);opacity:1}}
  @keyframes gfxDotRing     {0%{transform:translateX(-50%) translateY(-50%) scale(0.5);opacity:0.9}100%{transform:translateX(-50%) translateY(-50%) scale(2.8);opacity:0}}
  @keyframes gfxWinText     {0%{transform:scale(0.3) translateY(20px);opacity:0}55%{transform:scale(1.15) translateY(-4px);opacity:1}80%{transform:scale(0.97) translateY(1px)}100%{transform:scale(1) translateY(0);opacity:1}}
  @keyframes gfxLoseText    {0%{transform:translateY(-32px) scale(0.8);opacity:0}50%{transform:translateY(5px) scale(1.06);opacity:1}75%{transform:translateY(-2px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes gfxDiceRedVig  {0%,100%{opacity:0}25%,55%{opacity:1}}
  @keyframes gfxDiceGoldVig {0%{opacity:0}20%{opacity:1}100%{opacity:0}}
  @keyframes gfxPipPulse    {0%,100%{box-shadow:0 0 6px currentColor}50%{box-shadow:0 0 16px currentColor,0 0 28px currentColor}}
  @keyframes plinkoWinShimmer  {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes plinkoWinFlash    {0%{opacity:0.88}40%{opacity:0.88}100%{opacity:0}}
  @keyframes plinkoLightRay    {0%{transform:scaleY(0) rotate(var(--ray-angle));opacity:0.8}60%{opacity:0.5}100%{transform:scaleY(1.4) rotate(var(--ray-angle));opacity:0}}
  @keyframes plinkoLoseRing    {0%{width:0;height:0;opacity:0.95;border-width:3px}100%{width:320px;height:320px;opacity:0;border-width:1px}}
  @keyframes plinkoHeavyShake  {0%,100%{transform:translateX(0) rotate(0)}8%{transform:translateX(-14px) rotate(-0.5deg)}20%{transform:translateX(14px) rotate(0.5deg)}32%{transform:translateX(-11px) rotate(-0.3deg)}44%{transform:translateX(11px) rotate(0.3deg)}58%{transform:translateX(-7px)}72%{transform:translateX(7px)}86%{transform:translateX(-3px)}}
  @keyframes plinkoGridScroll  {0%{background-position:0 0}100%{background-position:0 40px}}
  @keyframes plinkoBucketPulse {0%,100%{filter:brightness(1.2) saturate(1.3)}50%{filter:brightness(2.2) saturate(1.8)}}
  @keyframes plinkoLoseGlitch  {0%,100%{filter:none;transform:translateX(0)}25%{filter:hue-rotate(180deg) brightness(1.5);transform:translateX(-4px)}75%{filter:hue-rotate(-180deg) brightness(1.5);transform:translateX(4px)}}
  @keyframes plinkoCountUp     {0%{transform:translateY(0)}100%{transform:translateY(-100%)}}
  @keyframes minesGemShimmer   {0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes minesGemPop       {0%{transform:scale(0) rotate(-180deg)}70%{transform:scale(1.18) rotate(8deg)}100%{transform:scale(1) rotate(0deg)}}
  @keyframes minesBombShake    {0%,100%{transform:translate(0,0) rotate(0)}15%{transform:translate(-5px,-3px) rotate(-4deg)}30%{transform:translate(5px,3px) rotate(3deg)}45%{transform:translate(-4px,-2px) rotate(-2deg)}60%{transform:translate(4px,2px) rotate(2deg)}75%{transform:translate(-2px,-1px) rotate(-1deg)}}
  @keyframes minesCardFlip3D   {0%{transform:perspective(400px) rotateY(90deg) scale(0.8);opacity:0}100%{transform:perspective(400px) rotateY(0deg) scale(1);opacity:1}}
  @keyframes minesRevealSweep  {0%{opacity:0;transform:translateY(-8px) scale(0.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes minesLoseGlitch   {0%,100%{filter:none;transform:translateX(0)}20%{filter:hue-rotate(120deg) brightness(1.8) saturate(2);transform:translateX(-5px)}40%{filter:hue-rotate(-120deg) brightness(1.8) saturate(2);transform:translateX(5px)}60%{filter:hue-rotate(180deg) brightness(1.5);transform:translateX(-3px)}80%{filter:none;transform:translateX(3px)}}
  @keyframes minesBoardFlash   {0%{opacity:0.9}100%{opacity:0}}
  @keyframes minesShockRing    {0%{width:0;height:0;opacity:0.9;border-width:3px}100%{width:360px;height:360px;opacity:0;border-width:1px}}
  @keyframes limboNumberDrop   {0%{transform:translateY(-120px) scale(0.6);opacity:0}70%{transform:translateY(8px) scale(1.04);opacity:1}85%{transform:translateY(-4px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes limboDigitTick    {0%,100%{opacity:1}50%{opacity:0.4;filter:blur(1px)}}
  @keyframes limboLaserSweep   {0%{top:-4px;opacity:0.9}90%{opacity:0.7}100%{top:100%;opacity:0}}
  @keyframes limboWinExplosion {0%{transform:scale(0);opacity:1}100%{transform:scale(4);opacity:0}}
  @keyframes limboLoseCrash    {0%{transform:scale(1);opacity:0.9}40%{transform:scale(1.04);opacity:0.8}100%{transform:scale(0.96);opacity:0}}
  @keyframes limboTargetPulse  {0%,100%{opacity:0.5;box-shadow:0 0 6px rgba(0,194,255,0.5)}50%{opacity:1;box-shadow:0 0 18px rgba(0,194,255,0.9),0 0 35px rgba(0,194,255,0.4)}}
  @keyframes limboOrbFloat     {0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.08)}}
  @keyframes limboFlashWhite   {0%{opacity:0.85}100%{opacity:0}}
  @keyframes limboShockRing    {0%{width:0;height:0;opacity:0.85;border-width:3px}100%{width:400px;height:400px;opacity:0;border-width:1px}}
  @keyframes wheelRimGlow      {0%{filter:drop-shadow(0 0 12px #ffd23f) drop-shadow(0 0 24px #ff5cb1)}33%{filter:drop-shadow(0 0 12px #00c2ff) drop-shadow(0 0 24px #a855f7)}66%{filter:drop-shadow(0 0 12px #4ade80) drop-shadow(0 0 24px #ffd23f)}100%{filter:drop-shadow(0 0 12px #ffd23f) drop-shadow(0 0 24px #ff5cb1)}}
  @keyframes wheelPointerBob   {0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-4px) rotate(-2deg)}}
  @keyframes wheelSegFlash     {0%,100%{filter:brightness(1)}50%{filter:brightness(2.2) saturate(1.6)}}
  @keyframes wheelWinFlash     {0%{opacity:0.85}100%{opacity:0}}
  @keyframes wheelLoseVig      {0%,100%{opacity:0}30%,70%{opacity:1}}
  @keyframes wheelShockRing    {0%{width:0;height:0;opacity:0.85;border-width:3px}100%{width:380px;height:380px;opacity:0;border-width:1px}}
  @keyframes wheelWinRay       {0%{transform:scaleY(0) rotate(var(--ray-a));opacity:0.85}60%{opacity:0.5}100%{transform:scaleY(1.5) rotate(var(--ray-a));opacity:0}}
  @keyframes towerTileReveal   {0%{transform:perspective(300px) rotateX(90deg) scale(0.8);opacity:0}100%{transform:perspective(300px) rotateX(0deg) scale(1);opacity:1}}
  @keyframes towerSafePulse    {0%,100%{box-shadow:0 0 12px rgba(245,158,11,0.6)}50%{box-shadow:0 0 26px rgba(245,158,11,1),0 0 45px rgba(245,158,11,0.4)}}
  @keyframes towerFailShatter  {0%,100%{transform:translate(0,0) skew(0,0)}20%{transform:translate(-4px,-3px) skew(-2deg,-1deg)}40%{transform:translate(4px,3px) skew(2deg,1deg)}60%{transform:translate(-3px,-2px) skew(-1deg,0)}80%{transform:translate(3px,2px) skew(1deg,0)}}
  @keyframes towerRowSweep     {0%{left:-100%}100%{left:110%}}
  @keyframes towerFloorGlow    {0%,100%{opacity:0.5}50%{opacity:1}}
  @keyframes towerTopReach     {0%,100%{transform:scale(1)}40%{transform:scale(1.18)}70%{transform:scale(0.96)}}
  @keyframes towerClimbTrail   {0%{opacity:0.9;transform:translateY(0) scaleY(1)}100%{opacity:0;transform:translateY(-40px) scaleY(0.2)}}
  @keyframes towerWinFlash     {0%{opacity:0.88}100%{opacity:0}}
  @keyframes towerShockRing    {0%{width:0;height:0;opacity:0.88;border-width:3px}100%{width:380px;height:380px;opacity:0;border-width:1px}}
  @keyframes kenoBallDrop      {0%{transform:translateY(-55px) scale(0.55);opacity:0}65%{transform:translateY(6px) scale(1.12);opacity:1}80%{transform:translateY(-3px) scale(0.97)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes kenoBallGlow      {0%,100%{box-shadow:0 0 12px rgba(255,210,63,0.6),0 0 4px rgba(255,210,63,0.9)}50%{box-shadow:0 0 26px rgba(255,210,63,1),0 0 50px rgba(255,210,63,0.45)}}
  @keyframes kenoPickSelect    {0%{transform:scale(1)}30%{transform:scale(1.18)}60%{transform:scale(0.94)}80%{transform:scale(1.06)}100%{transform:scale(1)}}
  @keyframes kenoDrawSweep     {0%{left:-30%}100%{left:110%}}
  @keyframes kenoMatchExplosion{0%{transform:scale(1);opacity:0.9}100%{transform:scale(2.8);opacity:0}}
  @keyframes kenoWinFlash      {0%{opacity:0.82}100%{opacity:0}}
  @keyframes kenoShockRing     {0%{width:0;height:0;opacity:0.88;border-width:3px}100%{width:370px;height:370px;opacity:0;border-width:1px}}
  @keyframes pokerCardDeal     {0%{transform:translateY(-110px) scale(0.35) rotateY(90deg);opacity:0}70%{transform:translateY(4px) scale(1.04) rotateY(0deg);opacity:1}85%{transform:translateY(-2px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes pokerHoldPulse    {0%,100%{box-shadow:0 0 10px rgba(255,210,63,0.5),0 -2px 0 rgba(255,210,63,0.4)}50%{box-shadow:0 0 22px rgba(255,210,63,1),0 -2px 0 rgba(255,210,63,0.8)}}
  @keyframes pokerWinGlow      {0%,100%{box-shadow:0 0 14px rgba(255,210,63,0.6)}50%{box-shadow:0 0 30px rgba(255,210,63,1),0 0 55px rgba(255,210,63,0.4)}}
  @keyframes pokerHandReveal   {0%{transform:scale(0.3) translateY(-30px);opacity:0}65%{transform:scale(1.12) translateY(0);opacity:1}80%{transform:scale(0.96)}100%{transform:scale(1);opacity:1}}
  @keyframes pokerRoyalShimmer {0%{filter:hue-rotate(0deg) brightness(1.2)}25%{filter:hue-rotate(90deg) brightness(1.4)}50%{filter:hue-rotate(180deg) brightness(1.2)}75%{filter:hue-rotate(270deg) brightness(1.4)}100%{filter:hue-rotate(360deg) brightness(1.2)}}
  @keyframes pokerWinFlash     {0%{opacity:0.85}100%{opacity:0}}
  @keyframes pokerShockRing    {0%{width:0;height:0;opacity:0.88;border-width:3px}100%{width:420px;height:420px;opacity:0;border-width:1px}}
  @keyframes bjCardDeal        {0%{transform:perspective(600px) rotateY(-90deg) translateX(60px) translateY(-40px);opacity:0}70%{transform:perspective(600px) rotateY(8deg) translateX(-3px) translateY(3px);opacity:1}85%{transform:perspective(600px) rotateY(-3deg)}100%{transform:perspective(600px) rotateY(0deg) translateX(0) translateY(0);opacity:1}}
  @keyframes bjCardFloat       {0%,100%{transform:translateY(0px) rotate(0deg)}40%{transform:translateY(-10px) rotate(-1deg)}70%{transform:translateY(-6px) rotate(1deg)}}
  @keyframes bjCardWinLift     {0%{transform:translateY(0) scale(1)}60%{transform:translateY(-18px) scale(1.06)}100%{transform:translateY(-12px) scale(1.04)}}
  @keyframes bjCardLoseDroop   {0%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(10px) rotate(-3deg) scale(0.96)}100%{transform:translateY(8px) rotate(-2deg) scale(0.97)}}
  @keyframes bjWinGoldFlood    {0%{opacity:0;transform:scale(0.5)}40%{opacity:0.75}80%{opacity:0.45}100%{opacity:0}}
  @keyframes bjLoseRedFlood    {0%{opacity:0}30%{opacity:0.8}70%{opacity:0.55}100%{opacity:0}}
  @keyframes bjBustShake       {0%,100%{transform:translateX(0) rotate(0)}10%{transform:translateX(-12px) rotate(-1deg)}25%{transform:translateX(12px) rotate(1deg)}40%{transform:translateX(-9px) rotate(-0.7deg)}55%{transform:translateX(9px) rotate(0.7deg)}70%{transform:translateX(-5px)}85%{transform:translateX(5px)}}
  @keyframes bjCardShimmer     {0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes bjRainbowRing     {0%{width:0;height:0;opacity:0.9;border-width:4px;border-color:#ffd23f}33%{border-color:#a855f7}66%{border-color:#00c2ff}100%{width:500px;height:500px;opacity:0;border-width:1px;border-color:#ff5cb1}}
  @keyframes bjTableGlow       {0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,0.3)}50%{box-shadow:0 0 0 3px rgba(255,215,0,0.7),0 0 40px rgba(255,215,0,0.25)}}
  @keyframes bjSpotlightPulse  {0%,100%{opacity:0.12}50%{opacity:0.28}}
  @keyframes bjWinText         {0%{transform:translateY(50px) scale(0.6);opacity:0}55%{transform:translateY(-8px) scale(1.08);opacity:1}75%{transform:translateY(3px) scale(0.97)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes bjLoseText        {0%{transform:translateY(-60px) scale(0.7);opacity:0}50%{transform:translateY(8px) scale(1.06);opacity:1}72%{transform:translateY(-4px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes bjSuitGlow        {0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
  @keyframes bjProfitCount     {0%{transform:translateY(16px);opacity:0}100%{transform:translateY(0);opacity:1}}
  @keyframes hiloCardReveal3D   {0%{transform:perspective(600px) rotateY(-90deg) scale(0.7);opacity:0}65%{transform:perspective(600px) rotateY(8deg) scale(1.04);opacity:1}80%{transform:perspective(600px) rotateY(-3deg) scale(0.98)}100%{transform:perspective(600px) rotateY(0deg) scale(1);opacity:1}}
  @keyframes hiloCardLift       {0%{transform:translateY(0) scale(1)}60%{transform:translateY(-20px) scale(1.12)}80%{transform:translateY(-16px) scale(1.08)}100%{transform:translateY(-16px) scale(1.08)}}
  @keyframes hiloCardCrumble    {0%{transform:scale(1) rotate(0deg);opacity:1}40%{transform:scale(1.1) rotate(-5deg);opacity:0.9}100%{transform:scale(0.1) rotate(25deg);opacity:0}}
  @keyframes hiloCardShakeRed   {0%,100%{transform:translateX(0) rotate(0)}10%{transform:translateX(-10px) rotate(-4deg)}25%{transform:translateX(10px) rotate(4deg)}40%{transform:translateX(-8px) rotate(-3deg)}55%{transform:translateX(8px) rotate(3deg)}70%{transform:translateX(-5px) rotate(-2deg)}85%{transform:translateX(5px) rotate(2deg)}}
  @keyframes hiloArenaBreath    {0%,100%{opacity:0.55}50%{opacity:1}}
  @keyframes hiloFloatCard      {0%,100%{transform:translateY(0px) rotate(0.5deg)}50%{transform:translateY(-9px) rotate(-0.5deg)}}
  @keyframes hiloMultFlash      {0%{filter:none}25%{filter:hue-rotate(60deg) brightness(1.5)}50%{filter:hue-rotate(120deg) brightness(1.6)}75%{filter:hue-rotate(200deg) brightness(1.5)}100%{filter:none}}
  @keyframes hiloPipGlow        {0%,100%{text-shadow:0 0 8px currentColor}50%{text-shadow:0 0 20px currentColor,0 0 40px currentColor}}
  @keyframes hiloSuitShimmer    {0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes hiloFlashWhite     {0%{opacity:0.9}100%{opacity:0}}
  @keyframes hiloRedVig         {0%,100%{opacity:0}25%,60%{opacity:1}}
  @keyframes hiloLabelSlideUp   {0%{transform:translateY(24px) scale(0.8);opacity:0}60%{transform:translateY(-4px) scale(1.08);opacity:1}80%{transform:translateY(2px) scale(0.98)}100%{transform:translateY(0) scale(1);opacity:1}}
  @keyframes hiloGlowPulse      {0%{border-color:rgba(255,45,219,0.7)}33%{border-color:rgba(111,0,255,0.7)}66%{border-color:rgba(0,234,255,0.6)}100%{border-color:rgba(255,45,219,0.7)}}
  @keyframes hiloHistorySlide   {0%{transform:translateX(40px);opacity:0}100%{transform:translateX(0);opacity:1}}
  @keyframes hiloCrownGlow      {0%,100%{filter:drop-shadow(0 0 6px #ffd700)}50%{filter:drop-shadow(0 0 18px #ffd700) drop-shadow(0 0 36px #ffaa00)}}
  @keyframes hiloShockRing      {0%{width:0;height:0;opacity:0.9;border-width:3px}100%{width:420px;height:420px;opacity:0;border-width:1px}}
  @keyframes hiloWinRay         {0%{transform:scaleY(0) rotate(var(--ray-a));opacity:0.9}60%{opacity:0.55}100%{transform:scaleY(1.6) rotate(var(--ray-a));opacity:0}}
  @keyframes dtCardFlip3D      {0%{transform:perspective(500px) rotateY(90deg) scale(0.9);opacity:0}100%{transform:perspective(500px) rotateY(0deg) scale(1);opacity:1}}
  @keyframes dtArenaBreath     {0%,100%{transform:scale(1)}50%{transform:scale(1.016)}}
  @keyframes dtVSPulse         {0%,100%{box-shadow:0 0 20px rgba(255,210,63,0.5),0 0 40px rgba(255,140,0,0.3)}50%{box-shadow:0 0 40px rgba(255,210,63,0.9),0 0 80px rgba(255,140,0,0.6),0 0 120px rgba(255,210,63,0.3)}}
  @keyframes dtTieAurora       {0%{opacity:0.7;filter:hue-rotate(0deg)}50%{opacity:1;filter:hue-rotate(60deg)}100%{opacity:0.7;filter:hue-rotate(0deg)}}
  @keyframes dtDragonFlicker   {0%,100%{text-shadow:0 0 15px #ff2200,0 0 30px #ff6600,0 0 60px #ff220055}45%{text-shadow:0 0 25px #ff4400,0 0 50px #ff8800,0 0 90px #ff440088}70%{text-shadow:0 0 10px #ff1100,0 0 20px #ff4400,0 0 40px #ff110033}}
  @keyframes dtTigerFlicker    {0%,100%{text-shadow:0 0 15px #0099ff,0 0 30px #00d4ff,0 0 60px #0099ff55}45%{text-shadow:0 0 25px #00bbff,0 0 50px #00eeff,0 0 90px #00bbff88}70%{text-shadow:0 0 10px #0077ff,0 0 20px #00aaff,0 0 40px #0077ff33}}
  @keyframes dtCardRiseFloat   {0%,100%{transform:translateY(0px) rotateZ(0deg)}50%{transform:translateY(-10px) rotateZ(1.5deg)}}
  @keyframes dtSlowWinVignette {0%{opacity:0}20%{opacity:1}100%{opacity:0}}
  @keyframes dtSlowLoseVignette{0%{opacity:0}15%{opacity:1}100%{opacity:0.4}}
  @keyframes dtEmberFloat      {0%{transform:translateY(0) translateX(0) scale(1);opacity:0.8}50%{transform:translateY(-55px) translateX(var(--ex,8px)) scale(0.7);opacity:0.5}100%{transform:translateY(-110px) translateX(var(--ex,8px)) scale(0.3);opacity:0}}
  @keyframes dtLightningZap    {0%,100%{opacity:0}10%,11%{opacity:0.9}20%,21%{opacity:0.7}22%,89%{opacity:0}90%,91%{opacity:0.5}}
  @keyframes dtTieShockRing    {0%{width:0;height:0;opacity:0.9;border-width:3px}100%{width:340px;height:340px;opacity:0;border-width:1px}}
  @keyframes dtWinCardFloat    {0%,100%{transform:translateY(0) scale(1.2)}50%{transform:translateY(-14px) scale(1.22)}}
  @keyframes dtGoldShimmer     {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes dtVSCoinSpin      {0%{transform:perspective(200px) rotateY(0deg)}100%{transform:perspective(200px) rotateY(360deg)}}
  @keyframes dtCompareBarFill  {0%{width:0}100%{width:var(--bar-target)}}
  @keyframes bjChipFall        {0%{transform:translateY(-80px) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(110%) rotate(var(--chip-rot,400deg)) scale(0.7);opacity:0}}
  @keyframes bjSuitDrift       {0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0.07}40%{transform:translateY(-24px) translateX(10px) rotate(8deg);opacity:0.13}70%{transform:translateY(-14px) translateX(-6px) rotate(3deg);opacity:0.09}100%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0.07}}
  @keyframes bjNeonPulse       {0%{border-color:rgba(0,255,136,0.65)}33%{border-color:rgba(255,210,63,0.85)}66%{border-color:rgba(0,194,255,0.7)}100%{border-color:rgba(0,255,136,0.65)}}
  @keyframes bjSlowWinBloom    {0%{opacity:0;transform:scale(0.6)}35%{opacity:0.9}65%{opacity:0.55}100%{opacity:0;transform:scale(1.15)}}
  @keyframes bjSlowLoseFade    {0%{opacity:0}25%{opacity:0.85}65%{opacity:0.65}100%{opacity:0}}
  @keyframes bjArenaDesaturate {0%{filter:saturate(1) brightness(1)}100%{filter:saturate(0.28) brightness(0.72)}}
  @keyframes bjArenaWinSaturate{0%{filter:saturate(1) brightness(1)}40%{filter:saturate(1.7) brightness(1.22)}100%{filter:saturate(1.35) brightness(1.08)}}
  @keyframes bjCardAmbientGlow {0%,100%{box-shadow:0 6px 22px rgba(0,0,0,0.58),0 0 0 1px rgba(0,255,136,0.15)}50%{box-shadow:0 6px 22px rgba(0,0,0,0.58),0 0 18px rgba(0,255,136,0.5),0 0 1px rgba(0,255,136,0.3)}}
  @keyframes bjDealerHoleFlip  {0%{transform:perspective(600px) rotateY(-90deg);opacity:0.5}60%{transform:perspective(600px) rotateY(10deg);opacity:1}80%{transform:perspective(600px) rotateY(-4deg)}100%{transform:perspective(600px) rotateY(0deg);opacity:1}}
  @keyframes bjTableBreath     {0%,100%{transform:scale(1)}50%{transform:scale(1.004)}}
  @keyframes bjSpotSway1       {0%,100%{transform:translateX(-50%) skewX(-4deg);opacity:0.18}50%{transform:translateX(-50%) skewX(4deg);opacity:0.28}}
  @keyframes bjSpotSway2       {0%,100%{transform:translateX(-50%) skewX(5deg);opacity:0.14}50%{transform:translateX(-50%) skewX(-5deg);opacity:0.22}}
  @keyframes bjSpotSway3       {0%,100%{transform:translateX(-50%) skewX(-3deg);opacity:0.12}50%{transform:translateX(-50%) skewX(3deg);opacity:0.20}}
  @keyframes bjGoldArcGlow     {0%,100%{border-color:rgba(0,255,136,0.28);box-shadow:0 0 22px rgba(0,255,136,0.1)}33%{border-color:rgba(255,210,63,0.55);box-shadow:0 0 40px rgba(255,210,63,0.2),inset 0 0 25px rgba(255,210,63,0.07)}66%{border-color:rgba(0,194,255,0.32);box-shadow:0 0 28px rgba(0,194,255,0.12)}}
  @keyframes bjWinArcGlow      {0%,100%{border-color:rgba(255,215,0,0.8);box-shadow:0 0 55px rgba(255,215,0,0.35),inset 0 0 30px rgba(255,215,0,0.1)}50%{border-color:rgba(255,255,120,1);box-shadow:0 0 80px rgba(255,215,0,0.6),inset 0 0 50px rgba(255,215,0,0.15)}}
  @keyframes bjLoseArcGlow     {0%,100%{border-color:rgba(255,40,40,0.5);box-shadow:0 0 30px rgba(255,40,40,0.2)}50%{border-color:rgba(255,80,80,0.85);box-shadow:0 0 55px rgba(255,40,40,0.4)}}
  @keyframes bjChipRain        {0%{transform:translateY(-40px) rotateZ(0deg);opacity:1}100%{transform:translateY(105%) rotateZ(var(--chip-rot,500deg));opacity:0}}
  @keyframes bjPulseRing2      {0%{transform:scale(0.4);opacity:0.8}100%{transform:scale(3.5);opacity:0}}
  @keyframes bjDividerShift    {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes bjScorePop        {0%{transform:scale(1)}40%{transform:scale(1.22)}65%{transform:scale(0.94)}80%{transform:scale(1.07)}100%{transform:scale(1)}}
  @keyframes bjRipple          {0%{transform:scale(0);opacity:0.5}100%{transform:scale(4);opacity:0}}
  @keyframes bjFlashWhite      {0%{opacity:0.75}100%{opacity:0}}
`;


export function GameStyles() {
  return <style>{GAME_KEYFRAMES}</style>;
}

/* ─── Theme palette ──────────────────────────────────────────── */
export interface GameTheme {
  primary: string;
  secondary: string;
  arenaBg: string;
  arenaGlow: string;
  winGlow: string;
  loseGlow: string;
  particleColors: string[];
}

export const GAME_THEMES: Record<string, GameTheme> = {
  crash: {
    primary: "#ff4e00", secondary: "#ff9a00",
    arenaBg: "radial-gradient(ellipse at 30% 20%, #1a003a 0%, #08001a 50%, #000510 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 100%, rgba(255,78,0,0.18) 0%, transparent 65%)",
    winGlow: "rgba(255,210,63,0.5)", loseGlow: "rgba(255,32,32,0.5)",
    particleColors: ["#ff4e00","#ff9a00","#ffd23f","#ffffff","#ff5cb1","#a855f7","#00c2ff"],
  },
  dice: {
    primary: "#a855f7", secondary: "#6366f1",
    arenaBg: "radial-gradient(ellipse at 50% 50%, #120d1e 0%, #07040f 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.12) 0%, transparent 60%)",
    winGlow: "rgba(168,85,247,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#a855f7","#6366f1","#c084fc","#818cf8","#ffffff","#a855f7","#e879f9"],
  },
  plinko: {
    primary: "#ec4899", secondary: "#a855f7",
    arenaBg: "radial-gradient(ellipse at 50% 10%, #1d0b2e 0%, #0a0514 55%, #030208 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.28) 0%, rgba(139,92,246,0.14) 45%, transparent 72%)",
    winGlow: "rgba(255,210,63,0.55)", loseGlow: "rgba(255,40,40,0.5)",
    particleColors: ["#ec4899","#a855f7","#f472b6","#c084fc","#ffd23f","#00c2ff","#ffffff"],
  },
  mines: {
    primary: "#4ade80", secondary: "#ffd23f",
    arenaBg: "radial-gradient(ellipse at 30% 20%, #071a0e 0%, #030d06 55%, #010204 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(74,222,128,0.18) 0%, rgba(255,210,63,0.06) 55%, transparent 75%)",
    winGlow: "rgba(74,222,128,0.55)", loseGlow: "rgba(239,68,68,0.55)",
    particleColors: ["#4ade80","#22c55e","#ffd23f","#86efac","#ffffff","#00c2ff","#a3e635"],
  },
  limbo: {
    primary: "#00c2ff", secondary: "#a855f7",
    arenaBg: "radial-gradient(ellipse at 50% 60%, #000820 0%, #00040f 55%, #000000 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(0,194,255,0.2) 0%, rgba(168,85,247,0.08) 50%, transparent 75%)",
    winGlow: "rgba(0,194,255,0.55)", loseGlow: "rgba(255,59,59,0.55)",
    particleColors: ["#00c2ff","#a855f7","#38bdf8","#c084fc","#ffffff","#ffd23f","#06b6d4"],
  },
  wheel: {
    primary: "#ffd23f", secondary: "#ff5cb1",
    arenaBg: "radial-gradient(ellipse at 50% 40%, #0d0018 0%, #060010 55%, #000005 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 55%, rgba(255,210,63,0.22) 0%, rgba(255,92,177,0.1) 45%, transparent 70%)",
    winGlow: "rgba(255,210,63,0.6)", loseGlow: "rgba(255,59,59,0.55)",
    particleColors: ["#ffd23f","#ff5cb1","#00c2ff","#4ade80","#ffffff","#a855f7","#fbbf24"],
  },
  tower: {
    primary: "#f59e0b", secondary: "#ef4444",
    arenaBg: "radial-gradient(ellipse at 50% 100%, #120a00 0%, #060010 50%, #010208 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.2) 0%, rgba(20,184,166,0.08) 50%, transparent 70%)",
    winGlow: "rgba(34,197,94,0.6)", loseGlow: "rgba(255,59,59,0.55)",
    particleColors: ["#22c55e","#ffd23f","#4ade80","#00c2ff","#ffffff","#fbbf24","#a855f7"],
  },
  keno: {
    primary: "#22c55e", secondary: "#ffd23f",
    arenaBg: "radial-gradient(ellipse at 50% 50%, #000c10 0%, #000810 55%, #000508 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.1) 0%, transparent 60%)",
    winGlow: "rgba(34,197,94,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#22c55e","#ffd23f","#4ade80","#fbbf24","#ffffff","#22c55e","#86efac"],
  },
  hilo: {
    primary: "#ff2ddb", secondary: "#6f00ff",
    arenaBg: "radial-gradient(ellipse at 50% 30%, #1f0038 0%, #0d0020 45%, #050010 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 20%, rgba(255,45,219,0.32) 0%, rgba(111,0,255,0.18) 50%, transparent 80%)",
    winGlow: "rgba(255,215,0,0.65)", loseGlow: "rgba(255,40,40,0.65)",
    particleColors: ["#ff2ddb","#6f00ff","#ffd700","#00eaff","#ff6ef7","#ffffff","#ff2ddb"],
  },
  videopoker: {
    primary: "#ffd23f", secondary: "#a855f7",
    arenaBg: "radial-gradient(ellipse at 50% 100%, #010d04 0%, #040808 40%, #020106 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 85%, rgba(255,210,63,0.18) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)",
    winGlow: "rgba(255,210,63,0.65)", loseGlow: "rgba(239,68,68,0.5)",
    particleColors: ["#ffd23f","#a855f7","#00c2ff","#f472b6","#ffffff","#fbbf24","#4ade80"],
  },
  dragontiger: {
    primary: "#ff2200", secondary: "#0099ff",
    arenaBg: "linear-gradient(90deg, #1a0004 0%, #0d0002 45%, #00050e 55%, #001a2e 100%)",
    arenaGlow: "radial-gradient(ellipse at 25% 50%, rgba(255,34,0,0.18) 0%, transparent 55%), radial-gradient(ellipse at 75% 50%, rgba(0,153,255,0.18) 0%, transparent 55%)",
    winGlow: "rgba(255,210,63,0.55)", loseGlow: "rgba(255,32,32,0.5)",
    particleColors: ["#ff2200","#ff6600","#ffd23f","#0099ff","#00d4ff","#ffffff","#ff5cb1"],
  },
  blackjack: {
    primary: "#00ff88", secondary: "#FFD23F",
    arenaBg: "radial-gradient(ellipse at 50% 65%, #0d2a1a 0%, #071810 38%, #040e08 72%, #020806 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 75%, rgba(0,255,136,0.28) 0%, rgba(255,210,63,0.1) 48%, transparent 72%)",
    winGlow: "rgba(255,215,0,0.85)", loseGlow: "rgba(255,30,30,0.72)",
    particleColors: ["#00ff88","#FFD23F","#4ade80","#ffd700","#ffffff","#00c2ff","#a855f7","#ff5cb1","#fbbf24","#86efac","#22d3ee","#f0ffa0"],
  },
  baccarat: {
    primary: "#a855f7", secondary: "#ec4899",
    arenaBg: "radial-gradient(ellipse at 50% 50%, #120810 0%, #070408 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.12) 0%, transparent 60%)",
    winGlow: "rgba(168,85,247,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#a855f7","#ec4899","#c084fc","#f472b6","#ffffff","#a855f7","#e879f9"],
  },
  roulette: {
    primary: "#ef4444", secondary: "#ffd23f",
    arenaBg: "radial-gradient(ellipse at 50% 40%, #100808 0%, #060404 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.12) 0%, transparent 60%)",
    winGlow: "rgba(239,68,68,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#ef4444","#ffd23f","#fca5a5","#fbbf24","#ffffff","#ef4444","#22c55e"],
  },
  fastcrash: {
    primary: "#00ff88", secondary: "#ffd23f",
    arenaBg: "radial-gradient(ellipse at 50% 80%, #040f07 0%, #020604 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 80%, rgba(0,255,136,0.12) 0%, transparent 60%)",
    winGlow: "rgba(0,255,136,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#00ff88","#ffd23f","#34d399","#fbbf24","#ffffff","#00ff88","#00c2ff"],
  },
  twist: {
    primary: "#06b6d4", secondary: "#8b5cf6",
    arenaBg: "radial-gradient(ellipse at 50% 50%, #050d12 0%, #020608 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)",
    winGlow: "rgba(6,182,212,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#06b6d4","#8b5cf6","#22d3ee","#a78bfa","#ffffff","#06b6d4","#0ea5e9"],
  },
  "cave-plunder": {
    primary: "#a78bfa", secondary: "#f59e0b",
    arenaBg: "radial-gradient(ellipse at 50% 0%, #0d0a14 0%, #060408 100%)",
    arenaGlow: "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)",
    winGlow: "rgba(167,139,250,0.4)", loseGlow: "rgba(255,59,59,0.35)",
    particleColors: ["#a78bfa","#f59e0b","#c4b5fd","#fbbf24","#ffffff","#a78bfa","#ec4899"],
  },
};

/* ─── GameArena wrapper ──────────────────────────────────────── */
interface GameArenaProps {
  gameId: string;
  win: boolean | null;
  shake?: boolean;
  children: React.ReactNode;
  minHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  desaturate?: boolean;
}

export function GameArena({ gameId, win, shake, children, minHeight = 380, className = "", style = {}, desaturate = false }: GameArenaProps) {
  const theme = GAME_THEMES[gameId] ?? GAME_THEMES["dice"];
  const isCrash = gameId === "crash";
  const borderColor = win === true ? theme.winGlow : win === false ? theme.loseGlow : isCrash ? "rgba(120,40,200,0.5)" : "rgba(47,69,83,0.7)";
  const glowOverlay = win === true ? theme.winGlow : win === false ? theme.loseGlow : "transparent";

  return (
    <div
      className={className}
      style={{
        background: theme.arenaBg,
        borderRadius: 16,
        border: `2px solid ${borderColor}`,
        minHeight,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.5s ease, filter 0.8s ease",
        animation: shake ? "gfxShake 0.55s ease-out" : "none",
        filter: desaturate ? "saturate(0.35) brightness(0.8)" : "saturate(1) brightness(1)",
        boxShadow: isCrash
          ? `0 0 40px rgba(120,40,200,0.2), inset 0 0 80px rgba(0,0,0,0.6)`
          : "none",
        ...style,
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: theme.arenaGlow, pointerEvents: "none", transition: "all 0.6s ease" }} />
      {/* Win/lose inner glow overlay */}
      {win !== null && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
          boxShadow: `inset 0 0 100px ${glowOverlay}`,
          transition: "box-shadow 0.5s ease",
        }} />
      )}
      {children}
    </div>
  );
}

/* ─── 3D Crash Background ────────────────────────────────────── */
export function CrashBackground3D({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Nebula blob 1 — purple/violet */}
      <div style={{
        position: "absolute", top: "-10%", left: "-5%",
        width: "55%", height: "55%",
        background: "radial-gradient(ellipse, rgba(120,40,220,0.28) 0%, rgba(80,0,160,0.12) 50%, transparent 70%)",
        filter: "blur(55px)",
        animation: "nebulaPulse 6s ease-in-out infinite",
        borderRadius: "50%",
      }} />
      {/* Nebula blob 2 — orange/gold */}
      <div style={{
        position: "absolute", bottom: "-10%", right: "-5%",
        width: "50%", height: "50%",
        background: `radial-gradient(ellipse, ${color}22 0%, ${color}0a 50%, transparent 70%)`,
        filter: "blur(60px)",
        animation: "nebulaPulse 8s ease-in-out 2s infinite",
        borderRadius: "50%",
        transition: "background 0.5s ease",
      }} />
      {/* Nebula blob 3 — cyan accent */}
      <div style={{
        position: "absolute", top: "30%", right: "10%",
        width: "30%", height: "30%",
        background: "radial-gradient(ellipse, rgba(0,194,255,0.1) 0%, transparent 70%)",
        filter: "blur(40px)",
        animation: "nebulaPulse 10s ease-in-out 4s infinite",
        borderRadius: "50%",
      }} />
      {/* 3D grid floor */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
        backgroundImage: `
          linear-gradient(to right, rgba(100,60,200,0.18) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(100,60,200,0.18) 1px, transparent 1px)
        `,
        backgroundSize: "40px 30px",
        transform: "perspective(300px) rotateX(55deg)",
        transformOrigin: "bottom center",
        animation: active ? "gridScroll 1.8s linear infinite" : "none",
        opacity: 0.7,
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
      }} />
      {/* Bottom horizon glow */}
      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%", height: "2px",
        background: `linear-gradient(90deg, transparent, ${color}88, rgba(0,194,255,0.6), ${color}88, transparent)`,
        filter: "blur(4px)",
        transition: "background 0.5s ease",
      }} />
    </div>
  );
}

/* ─── Rocket Trail ───────────────────────────────────────────── */
export function RocketTrail({ points }: { points: Array<{ x: number; y: number }> }) {
  if (points.length < 2) return null;
  return (
    <>
      {points.slice(-8).map((pt, i, arr) => {
        const opacity = (i / arr.length) * 0.6;
        const size = 4 + (i / arr.length) * 6;
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={size * 0.5}
            fill={`rgba(255,154,0,${opacity})`}
            filter="url(#glow)"
          />
        );
      })}
    </>
  );
}

/* ─── Milestone Flash ────────────────────────────────────────── */
const MILESTONES = [2, 5, 10, 50, 100];
const MILESTONE_LABELS: Record<number, string> = {
  2: "🔥 2×", 5: "⚡ 5×!", 10: "💎 10×!!", 50: "🚀 50×!!!", 100: "👑 100×!!!!"
};
const MILESTONE_COLORS: Record<number, string> = {
  2: "#ffd23f", 5: "#ff8c00", 10: "#ff5cb1", 50: "#a855f7", 100: "#00c2ff"
};

export function MilestoneFlash({ multiplier, active }: { multiplier: number; active: boolean }) {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (!active) { setShown(new Set()); setCurrent(null); return; }
    const hit = MILESTONES.find(m => multiplier >= m && !shown.has(m));
    if (hit) {
      setShown(prev => new Set([...prev, hit]));
      setCurrent(hit);
      const t = setTimeout(() => setCurrent(null), 1200);
      return () => clearTimeout(t);
    }
  }, [multiplier, active]);

  return (
    <AnimatePresence>
      {current !== null && (
        <motion.div
          key={`milestone-${current}`}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1.1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          style={{
            position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
            zIndex: 60, pointerEvents: "none", textAlign: "center",
          }}
        >
          <div style={{
            fontSize: 32, fontWeight: 900,
            fontFamily: "var(--font-orbitron), monospace",
            color: MILESTONE_COLORS[current],
            textShadow: `0 0 20px ${MILESTONE_COLORS[current]}, 0 0 40px ${MILESTONE_COLORS[current]}88`,
            letterSpacing: 2,
            padding: "6px 20px",
            background: `${MILESTONE_COLORS[current]}18`,
            borderRadius: 12,
            border: `1.5px solid ${MILESTONE_COLORS[current]}44`,
            backdropFilter: "blur(8px)",
          }}>
            {MILESTONE_LABELS[current]}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Crash Explosion ────────────────────────────────────────── */
export function CrashExplosion({ active, x, y }: { active: boolean; x: number; y: number }) {
  if (!active) return null;
  const debrisColors = ["#ff2020", "#ff8c00", "#ffd23f", "#ff5cb1", "#ffffff", "#ff2020"];
  return (
    <g>
      {/* Shockwave rings */}
      {[0, 1, 2].map((i) => (
        <circle
          key={`sw-${i}`}
          cx={x} cy={y} r={20}
          fill="none"
          stroke={i === 0 ? "#ffffff" : i === 1 ? "#ff4e00" : "#ff2020"}
          strokeWidth={3 - i}
          style={{ animation: `shockwave 0.7s ease-out ${i * 0.08}s forwards`, opacity: 0 }}
        />
      ))}
      {/* Debris particles */}
      {debrisColors.map((col, i) => (
        <circle
          key={`deb-${i}`}
          cx={x} cy={y} r={4}
          fill={col}
          style={{
            animation: `debrisFly${i} 0.8s ease-out forwards`,
            filter: `drop-shadow(0 0 4px ${col})`,
          }}
        />
      ))}
    </g>
  );
}

/* ─── Slow Win Reveal ────────────────────────────────────────── */
export function SlowWinReveal({ active, cashoutAt, profit, asset }: {
  active: boolean; cashoutAt: number | null; profit?: number; asset?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 80);
    const t2 = setTimeout(() => setStep(2), 300);
    const t3 = setTimeout(() => setStep(3), 520);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="win-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Gold vignette flash */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,210,63,0.25) 0%, transparent 70%)",
            animation: "goldVignette 1.2s ease-out forwards",
          }} />

          {/* CASHED OUT text */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{
              fontSize: 28, fontWeight: 900,
              fontFamily: "var(--font-orbitron), monospace",
              background: "linear-gradient(90deg, #ffd23f, #00c2ff, #ffd23f)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 16px rgba(255,210,63,0.9))",
              letterSpacing: 2, textAlign: "center",
              marginBottom: 4,
            }}
          >
            ✅ CASHED OUT @ {cashoutAt?.toFixed(2)}×
          </motion.div>

          {/* Profit amount */}
          {step >= 2 && profit !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                fontSize: 16, fontWeight: 800,
                color: "#00c2ff",
                textShadow: "0 0 12px rgba(0,194,255,0.8)",
                marginBottom: 8,
              }}
            >
              +{profit.toFixed(6)} {asset}
            </motion.div>
          )}

          {/* YOU WIN banner */}
          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              style={{
                fontSize: 36, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                background: "linear-gradient(90deg,#FFD700,#00c2ff,#ff5cb1,#FFD700)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(255,215,0,0.9))",
                animation: "shimmer 2s linear infinite",
              }}
            >
              🏆 YOU WIN!
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Slow Lose Reveal ───────────────────────────────────────── */
export function SlowLoseReveal({ active, crashPoint }: {
  active: boolean; crashPoint: number | null;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 100);
    const t2 = setTimeout(() => setStep(2), 380);
    const t3 = setTimeout(() => setStep(3), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="lose-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Red vignette flash */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,32,32,0.35) 0%, transparent 70%)",
            animation: "redVignette 0.9s ease-out forwards",
          }} />

          {/* Slow red pulse rings */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute",
              width: 180, height: 180, borderRadius: "50%",
              border: `2px solid rgba(255,32,32,${0.7 - i * 0.2})`,
              animation: `gfxPulseRing 1.4s ease-out ${i * 0.28}s forwards`,
              opacity: 0,
            }} />
          ))}

          {/* CRASHED text — slams in */}
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: -36, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 16 }}
              style={{
                fontSize: 24, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                color: "#ff2020",
                textShadow: "0 0 20px rgba(255,32,32,0.9), 0 0 40px rgba(255,32,32,0.5)",
                letterSpacing: 2, marginBottom: 6,
              }}
            >
              💥 CRASHED @ {crashPoint?.toFixed(2)}×
            </motion.div>
          )}

          {/* YOU LOSE — fades in */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                fontSize: 38, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                color: "#ff3b3b",
                textShadow: "0 0 24px rgba(255,59,59,0.85), 0 4px 0 rgba(0,0,0,0.8), 0 3px 0 #7a0000",
                letterSpacing: 3,
              }}>
                💀 YOU LOSE
              </div>
            </motion.div>
          )}

          {/* Better luck text */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ fontSize: 12, color: "#b1bad3", fontWeight: 600, marginTop: 8 }}
            >
              Better luck next time
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Particle burst ─────────────────────────────────────────── */
export function ParticleBurst({ active, colors }: { active: boolean; colors: string[] }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
          height: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
          borderRadius: i % 2 === 0 ? "50%" : "2px",
          background: colors[i % colors.length],
          animation: `gfxParticle${i} 0.9s ease-out forwards`,
          boxShadow: `0 0 6px ${colors[i % colors.length]}`,
        }} />
      ))}
    </div>
  );
}

/* ─── Pulse rings ────────────────────────────────────────────── */
export function PulseRings({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 20 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute",
          width: 160, height: 160,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          animation: `gfxPulseRing 1.1s ease-out ${i * 0.22}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

/* ─── Confetti rain ──────────────────────────────────────────── */
export function ConfettiRain({ active, colors }: { active: boolean; colors: string[] }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 25 }}>
      {colors.slice(0, 8).map((color, i) => (
        <div key={i} style={{
          position: "absolute", top: 0,
          left: `${10 + i * 11}%`,
          width: 8, height: 12, borderRadius: 2,
          background: color,
          animation: `gfxConfetti${i} ${1.2 + i * 0.12}s ease-in ${i * 0.08}s forwards`,
        }} />
      ))}
    </div>
  );
}

/* ─── Win banner (used in non-crash games & as fallback) ─────── */
export function WinBanner({ win, payout, multiplier, gameLabel }: {
  win: boolean | null; payout?: string; multiplier?: string; gameLabel?: string;
}) {
  return (
    <AnimatePresence>
      {win === true && (
        <motion.div
          key="win-banner"
          initial={{ y: -30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          style={{ textAlign: "center", marginTop: 20 }}
        >
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: 2,
            fontFamily: "var(--font-orbitron), monospace",
            background: "linear-gradient(90deg,#FFD700,#00c2ff,#FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 14px rgba(255,215,0,0.75))",
          }}>
            🏆 YOU WIN!
          </div>
          {(payout || multiplier) && (
            <div style={{ fontSize: 13, color: "#00c2ff", fontWeight: 700, marginTop: 4 }}>
              {multiplier && <span>{multiplier} </span>}
              {payout && <span>+{payout}</span>}
            </div>
          )}
        </motion.div>
      )}
      {win === false && (
        <motion.div
          key="lose-banner"
          initial={{ y: -30, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          style={{ textAlign: "center", marginTop: 20 }}
        >
          <div style={{
            fontSize: 26, fontWeight: 900, color: "#ff5c5c", letterSpacing: 2,
            fontFamily: "var(--font-orbitron), monospace",
            filter: "drop-shadow(0 0 10px rgba(255,59,59,0.7))",
          }}>
            💀 YOU LOSE
          </div>
          <div style={{ fontSize: 12, color: "#b1bad3", fontWeight: 600, marginTop: 4 }}>
            Better luck next time
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Big Win banner (for high multipliers) ──────────────────── */
export function BigWinBanner({ show, multiplier }: { show: boolean; multiplier: number }) {
  return (
    <AnimatePresence>
      {show && multiplier >= 10 && (
        <motion.div
          key="bigwin"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 50, textAlign: "center", pointerEvents: "none",
          }}
        >
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: 4,
            fontFamily: "var(--font-orbitron), monospace",
            background: "linear-gradient(90deg,#ffd23f,#ff5cb1,#a855f7,#00c2ff,#ffd23f)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(255,210,63,0.9))",
            animation: "gfxPulse 0.5s ease-in-out infinite",
          }}>
            🔥 BIG WIN!
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ffd23f", marginTop: 4 }}>
            {multiplier.toFixed(2)}×
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Streak badge ───────────────────────────────────────────── */
export function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const hot = streak >= 3;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: hot ? "linear-gradient(90deg,#7c2d12,#ea580c)" : "#1a2c38",
      border: `1px solid ${hot ? "#f97316" : "#2f4553"}`,
      borderRadius: 20, padding: "3px 10px",
      boxShadow: hot ? "0 0 16px rgba(249,115,22,0.5)" : "none",
    }}>
      <span style={{ fontSize: 15, animation: hot ? "gfxFlame 0.7s ease-in-out infinite" : "none", display: "inline-block" }}>🔥</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: hot ? "#fed7aa" : "#b1bad3" }}>
        {streak}× Win Streak!
      </span>
    </div>
  );
}

/* ─── 3D Playing Card ────────────────────────────────────────── */
export interface PlayingCard { suit: "♠" | "♥" | "♦" | "♣"; rank: string; }

const SUIT_COLORS_TEXT: Record<string, string> = { "♠": "#0f1f35", "♣": "#0f1f35", "♥": "#c0001a", "♦": "#c0001a" };
const SUIT_GLOW_COLORS: Record<string, string> = { "♠": "rgba(0,150,255,0.3)", "♣": "rgba(0,150,255,0.3)", "♥": "rgba(220,0,40,0.35)", "♦": "rgba(220,0,40,0.35)" };
const IS_RED_SUIT: Record<string, boolean> = { "♠": false, "♣": false, "♥": true, "♦": true };

export function Card3D({ card, faceDown = false, lifted = false, drooping = false, delay = 0, dealMode = false }: {
  card?: PlayingCard; faceDown?: boolean; lifted?: boolean; drooping?: boolean; delay?: number; dealMode?: boolean;
}) {
  const textColor = card ? SUIT_COLORS_TEXT[card.suit] : "#0f1f35";
  const suitGlow = card ? SUIT_GLOW_COLORS[card.suit] : "transparent";
  const isRed = card ? IS_RED_SUIT[card.suit] : false;

  const winBoxShadow = `0 0 0 1.5px #FFD70066, 0 14px 35px rgba(0,0,0,0.65), 0 0 22px rgba(255,215,0,0.45), 0 0 8px ${suitGlow}`;
  const normalBoxShadow = `0 6px 20px rgba(0,0,0,0.55), 2px 3px 0 rgba(0,0,0,0.25), 0 0 6px ${suitGlow}`;
  const droopBoxShadow = `0 2px 8px rgba(0,0,0,0.4), 0 0 4px rgba(255,40,40,0.2)`;

  return (
    <motion.div
      initial={dealMode ? { rotateY: -90, x: 50, y: -35, opacity: 0 } : { y: -40, opacity: 0, rotateZ: -8 }}
      animate={
        lifted
          ? { rotateY: 0, x: 0, y: -14, opacity: 1, rotateZ: 0, scale: 1.05 }
          : drooping
          ? { rotateY: 0, x: 0, y: 8, opacity: 1, rotateZ: -2, scale: 0.97 }
          : { rotateY: 0, x: 0, y: 0, opacity: 1, rotateZ: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: dealMode ? 220 : 300, damping: dealMode ? 22 : 20, delay }}
      style={{
        width: 76, height: 106,
        borderRadius: 10,
        background: faceDown
          ? "linear-gradient(145deg, #122040 0%, #0a1628 45%, #122040 100%)"
          : "linear-gradient(160deg, #fefefe 0%, #f0f4f8 100%)",
        border: faceDown ? "1.5px solid #1e3a5f" : "1.5px solid #d8e2ef",
        boxShadow: lifted ? winBoxShadow : drooping ? droopBoxShadow : normalBoxShadow,
        position: "relative",
        flexShrink: 0,
        cursor: "default",
        transformStyle: "preserve-3d",
        transition: "box-shadow 0.4s ease",
        overflow: "hidden",
      }}
    >
      {faceDown ? (
        <>
          {/* Premium card back — dark blue with gold diamond lattice */}
          <div style={{
            position: "absolute", inset: 5, borderRadius: 7,
            background: "repeating-linear-gradient(45deg, #1a3557 0px, #1a3557 5px, #0d2140 5px, #0d2140 10px)",
            border: "1px solid #2a4f7f55",
          }}/>
          {/* Gold diamond accent center */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%) rotate(45deg)",
            width: 22, height: 22,
            border: "1.5px solid rgba(255,215,0,0.5)",
            borderRadius: 3,
            boxShadow: "0 0 8px rgba(255,215,0,0.25)",
          }}/>
          {/* Specular on back */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 35,
            borderRadius: "10px 10px 0 0",
            background: "linear-gradient(180deg,rgba(255,255,255,0.12),transparent)",
            pointerEvents: "none",
          }}/>
        </>
      ) : card && (
        <>
          {/* Holographic shimmer sweep */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 10,
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, rgba(180,220,255,0.12) 55%, transparent 70%)",
            backgroundSize: "250% 100%",
            animation: "bjCardShimmer 3.5s linear infinite",
            pointerEvents: "none", zIndex: 4,
          }}/>

          {/* Suit-colored inner glow ring */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 10,
            boxShadow: `inset 0 0 18px ${suitGlow}`,
            pointerEvents: "none", zIndex: 3,
          }}/>

          {/* Top-left rank + suit */}
          <div style={{
            position: "absolute", top: 5, left: 6, fontSize: 13, fontWeight: 900,
            color: textColor, lineHeight: 1.1, zIndex: 5,
            textShadow: isRed ? "0 0 6px rgba(200,0,30,0.3)" : "0 0 6px rgba(0,80,180,0.2)",
          }}>
            <div style={{ fontSize: 14, letterSpacing: -0.5 }}>{card.rank}</div>
            <div style={{ fontSize: 12 }}>{card.suit}</div>
          </div>

          {/* Center suit — large */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 30, color: textColor, zIndex: 5,
            filter: isRed ? "drop-shadow(0 0 4px rgba(200,0,30,0.4))" : "drop-shadow(0 0 4px rgba(0,80,180,0.25))",
          }}>
            {card.suit}
          </div>

          {/* Bottom-right rank + suit (rotated 180°) */}
          <div style={{
            position: "absolute", bottom: 5, right: 6, fontSize: 13, fontWeight: 900,
            color: textColor, lineHeight: 1.1, transform: "rotate(180deg)", zIndex: 5,
            textShadow: isRed ? "0 0 6px rgba(200,0,30,0.3)" : "0 0 6px rgba(0,80,180,0.2)",
          }}>
            <div style={{ fontSize: 14, letterSpacing: -0.5 }}>{card.rank}</div>
            <div style={{ fontSize: 12 }}>{card.suit}</div>
          </div>

          {/* Top specular highlight */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 45,
            borderRadius: "10px 10px 0 0",
            background: "linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.05))",
            pointerEvents: "none", zIndex: 6,
          }}/>

          {/* Bottom-right 3D depth edge */}
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: "100%", height: "100%",
            borderRadius: 10,
            boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.1), inset 2px 2px 0 rgba(255,255,255,0.35)",
            pointerEvents: "none", zIndex: 2,
          }}/>
        </>
      )}
    </motion.div>
  );
}

/* ─── Neon multiplier display (premium 3D version) ───────────── */
export function NeonMultiplier({ value, color, size = "lg" }: { value: string; color: string; size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "lg" ? 68 : size === "md" ? 42 : 28;
  // 3D layered text-shadow for depth
  const shadow = [
    `0 1px 0 ${color}cc`,
    `0 2px 0 ${color}99`,
    `0 3px 0 ${color}66`,
    `0 4px 0 ${color}44`,
    `0 0 20px ${color}aa`,
    `0 0 50px ${color}55`,
    `0 0 80px ${color}22`,
  ].join(", ");

  return (
    <div style={{
      fontSize,
      fontWeight: 900,
      color,
      fontFamily: "'Orbitron', 'Courier New', monospace",
      textShadow: shadow,
      letterSpacing: 3,
      transition: "color 0.3s ease, text-shadow 0.3s ease",
      animation: "gfxFlicker 4s ease-in-out infinite",
      lineHeight: 1,
      userSelect: "none",
    }}>
      {value}
    </div>
  );
}

/* ─── Spotlight beam ─────────────────────────────────────────── */
export function Spotlight({ color, active }: { color: string; active?: boolean }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
      width: 280, height: "70%",
      background: `linear-gradient(180deg,${color}28 0%,${color}08 60%,transparent 100%)`,
      clipPath: "polygon(30% 0%,70% 0%,92% 100%,8% 100%)",
      animation: active ? "gfxSpotlight 0.6s ease-in-out infinite" : "none",
      opacity: active ? 1 : 0.12,
      pointerEvents: "none",
      transition: "opacity 0.5s",
    }}/>
  );
}

/* ─── Floor/progress indicator ───────────────────────────────── */
export function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = Math.min(100, (current / total) * 100);
  return (
    <div style={{ height: 4, borderRadius: 4, background: "rgba(47,69,83,0.6)", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 4,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width 0.4s ease",
        boxShadow: `0 0 8px ${color}`,
      }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DICE GAME EFFECTS
═══════════════════════════════════════════════════════════════ */

/* ─── Dice arena background ──────────────────────────────────── */
export function DiceBackground3D({ state }: { state: "idle" | "rolling" | "win" | "lose" }) {
  const accentR = state === "win" ? "255,210,63" : state === "lose" ? "255,68,68" : "168,85,247";
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Nebula blob 1 — violet/accent */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "60%", height: "60%",
        background: `radial-gradient(ellipse, rgba(${accentR},0.22) 0%, rgba(${accentR},0.08) 55%, transparent 75%)`,
        filter: "blur(60px)",
        animation: "nebulaPulse 7s ease-in-out infinite",
        borderRadius: "50%",
        transition: "background 0.8s ease",
      }} />
      {/* Nebula blob 2 — indigo */}
      <div style={{
        position: "absolute", bottom: "-10%", right: "-8%",
        width: "50%", height: "50%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, rgba(67,56,202,0.08) 55%, transparent 75%)",
        filter: "blur(55px)",
        animation: "nebulaPulse 9s ease-in-out 3s infinite",
        borderRadius: "50%",
      }} />
      {/* Isometric dot-grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(${accentR},0.18) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        opacity: state === "rolling" ? 0.75 : 0.35,
        transition: "opacity 0.4s ease, background-image 0.6s ease",
      }} />
      {/* Top glow line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, rgba(${accentR},0.5), transparent)`,
        transition: "background 0.6s ease",
      }} />
    </div>
  );
}

/* ─── Premium Result Bar ─────────────────────────────────────── */
interface PremiumResultBarProps {
  target: number;
  direction: "under" | "over";
  roll: number | null;
  win: boolean | null;
}

export function PremiumResultBar({ target, direction, roll, win }: PremiumResultBarProps) {
  const [dotVisible, setDotVisible] = useState(false);

  useEffect(() => {
    if (roll !== null) {
      const t = setTimeout(() => setDotVisible(true), 80);
      return () => clearTimeout(t);
    } else {
      setDotVisible(false);
    }
  }, [roll]);

  const winZoneLeft  = direction === "under" ? 0 : target;
  const winZoneWidth = direction === "under" ? target : 100 - target;
  const loseZoneLeft  = direction === "under" ? target : 0;
  const loseZoneWidth = direction === "under" ? 100 - target : target;

  const dotColor = win === true ? "#ffd23f" : win === false ? "#ff4444" : "#a855f7";
  const dotGlow  = win === true
    ? "0 0 14px #ffd23f, 0 0 28px #ffd23f88"
    : win === false
    ? "0 0 14px #ff4444, 0 0 28px #ff444488"
    : "0 0 10px #a855f7";

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Bar track */}
      <div style={{
        position: "relative",
        height: 20,
        borderRadius: 10,
        overflow: "visible",
        background: "rgba(15,33,46,0.9)",
        border: "1px solid rgba(47,69,83,0.7)",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
      }}>
        {/* Lose zone */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${loseZoneLeft}%`, width: `${loseZoneWidth}%`,
          background: win === false
            ? "linear-gradient(90deg, rgba(120,0,0,0.8), rgba(200,20,20,0.6))"
            : "rgba(50,10,10,0.5)",
          borderRadius: direction === "under" ? "0 10px 10px 0" : "10px 0 0 10px",
          transition: "background 0.5s ease",
        }} />

        {/* Win zone — vivid gradient */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${winZoneLeft}%`, width: `${winZoneWidth}%`,
          background: win === true
            ? "linear-gradient(90deg, #3730a3, #6366f1, #a855f7, #c084fc, #ffd23f)"
            : "linear-gradient(90deg, #3730a3, #6366f1, #a855f7, #c084fc)",
          borderRadius: direction === "under" ? "10px 0 0 10px" : "0 10px 10px 0",
          boxShadow: win === true
            ? "0 0 20px rgba(255,210,63,0.55), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "0 0 12px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
          animation: win === true ? "gfxWinZonePulse 1s ease-in-out 3" : "none",
          transition: "background 0.5s ease, box-shadow 0.5s ease",
        }} />

        {/* Specular shine */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Target line */}
        <div style={{
          position: "absolute",
          left: `${target}%`, top: -5, bottom: -5,
          width: 2.5,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 2px #fff",
          transform: "translateX(-50%)",
          borderRadius: 2,
          zIndex: 5,
        }} />

        {/* Roll result dot */}
        {roll !== null && (
          <div style={{ position: "absolute", top: "50%", left: `${roll}%`, zIndex: 10 }}>
            {/* Expanding ring */}
            {dotVisible && (
              <div style={{
                position: "absolute",
                width: 30, height: 30,
                borderRadius: "50%",
                border: `2px solid ${dotColor}`,
                top: "50%", left: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                animation: "gfxDotRing 0.85s ease-out forwards",
                opacity: 0,
              }} />
            )}
            {/* Main dot */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={dotVisible ? { scale: 1, opacity: 1 } : { scale: 0.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.06 }}
              style={{
                position: "absolute",
                width: 24, height: 24,
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.8) 0%, ${dotColor} 60%)`,
                boxShadow: dotGlow,
                border: "2.5px solid rgba(255,255,255,0.6)",
              }}
            />
          </div>
        )}
      </div>

      {/* Tick scale */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingLeft: 4, paddingRight: 4 }}>
        {[0, 25, 50, 75, 100].map((v) => (
          <div key={v} style={{ textAlign: "center" }}>
            <div style={{ width: 1, height: 4, background: "rgba(161,186,211,0.35)", margin: "0 auto 3px" }} />
            <span style={{ fontSize: 9, color: "rgba(161,186,211,0.65)", fontFamily: "monospace" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Target label pinned above the line */}
      <div style={{ position: "relative", marginTop: -30, height: 0, overflow: "visible" }}>
        <div style={{
          position: "absolute",
          left: `${target}%`,
          transform: "translateX(-50%)",
          top: -22,
          fontSize: 9, fontWeight: 700,
          color: "rgba(255,255,255,0.75)",
          background: "rgba(20,10,50,0.85)",
          padding: "1px 5px", borderRadius: 4,
          border: "1px solid rgba(168,85,247,0.5)",
          whiteSpace: "nowrap", zIndex: 6,
        }}>
          {target.toFixed(0)}
        </div>
      </div>
    </div>
  );
}

/* ─── Dice Win Reveal ────────────────────────────────────────── */
export function DiceWinReveal({ active, multiplier, profit, asset }: {
  active: boolean; multiplier: number; profit: number; asset: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 120);
    const t2 = setTimeout(() => setStep(2), 380);
    const t3 = setTimeout(() => setStep(3), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="dice-win"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Gold vignette */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 35%, rgba(255,210,63,0.22) 0%, transparent 65%)",
            animation: "gfxDiceGoldVig 1.6s ease-out forwards",
          }} />

          {step >= 2 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 42, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                background: "linear-gradient(90deg, #ffd23f, #ffffff, #ffd23f)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(255,210,63,0.95))",
                animation: "shimmer 1.8s linear infinite",
                letterSpacing: 3,
              }}>
                🎉 YOU WIN!
              </div>

              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ marginTop: 8 }}
                >
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    fontFamily: "var(--font-orbitron), monospace",
                    color: "#ffd23f",
                    textShadow: "0 0 14px rgba(255,210,63,0.85)",
                  }}>
                    {multiplier.toFixed(2)}×
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: "#00c2ff",
                    textShadow: "0 0 8px rgba(0,194,255,0.7)",
                    marginTop: 4,
                  }}>
                    +{profit.toFixed(6)} {asset}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Dice Lose Reveal ───────────────────────────────────────── */
export function DiceLoseReveal({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 180);
    const t2 = setTimeout(() => setStep(2), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="dice-lose"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Red vignette */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 35%, rgba(255,68,68,0.3) 0%, transparent 65%)",
            animation: "gfxDiceRedVig 1.2s ease-out forwards",
          }} />

          {/* Red pulse rings */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute",
              width: 140, height: 140, borderRadius: "50%",
              border: `2px solid rgba(255,68,68,${0.6 - i * 0.15})`,
              animation: `gfxPulseRing 1.3s ease-out ${i * 0.25}s forwards`,
              opacity: 0,
            }} />
          ))}

          {/* YOU LOSE */}
          <motion.div
            initial={{ y: -32, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            style={{ textAlign: "center", zIndex: 10 }}
          >
            <div style={{
              fontSize: 40, fontWeight: 900,
              fontFamily: "var(--font-orbitron), monospace",
              color: "#ff4444",
              textShadow: "0 0 26px rgba(255,68,68,0.95), 0 4px 0 rgba(0,0,0,0.8), 0 3px 0 #7a0000",
              letterSpacing: 3,
            }}>
              💀 YOU LOSE
            </div>

            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{ fontSize: 12, color: "#b1bad3", fontWeight: 600, marginTop: 8 }}
              >
                Better luck next time
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLINKO GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

/* ─── PlinkoBoardBackground ──────────────────────────────────── */
export function PlinkoBoardBackground({ dropping }: { dropping: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 16 }}>
      {/* Ambient top glow */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
        background: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.22) 0%, rgba(139,92,246,0.1) 50%, transparent 80%)",
        pointerEvents: "none",
      }} />
      {/* Perspective grid — animates only while ball is dropping */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
        backgroundImage: `
          linear-gradient(to right, rgba(139,92,246,0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(139,92,246,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "36px 40px",
        transform: "perspective(280px) rotateX(52deg)",
        transformOrigin: "bottom center",
        animation: dropping ? "plinkoGridScroll 1.4s linear infinite" : "none",
        opacity: dropping ? 0.65 : 0.28,
        transition: "opacity 0.5s ease",
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
      }} />
      {/* Bottom horizon line */}
      <div style={{
        position: "absolute", bottom: 58, left: "5%", right: "5%", height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.7), rgba(139,92,246,0.7), transparent)",
        filter: "blur(3px)",
      }} />
    </div>
  );
}

/* ─── CountUp sub-component ──────────────────────────────────── */
function PlinkoCountUp({ target, asset, onTick }: { target: number; asset: string; onTick: (p: number) => void }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const rawT = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const t = 1 - Math.pow(1 - rawT, 3);
      setDisplay(t * target);
      onTick(t);
      if (rawT < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div style={{
      fontSize: 22, fontWeight: 800,
      fontFamily: "var(--font-orbitron), monospace",
      color: "#00c2ff",
      textShadow: "0 0 16px rgba(0,194,255,0.9), 0 0 32px rgba(0,194,255,0.4)",
      letterSpacing: 1,
    }}>
      +{display.toFixed(4)} {asset}
    </div>
  );
}

/* ─── PlinkoSlowWinReveal — 6-step, ~3500ms ─────────────────── */
export function PlinkoSlowWinReveal({
  active, multiplier, profit, asset,
}: {
  active: boolean; multiplier: number; profit: number; asset: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    // Step timings: flash→rays→vignette→multiplier text→counter→YOU WIN→shimmer
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 220),
      setTimeout(() => setStep(3), 520),
      setTimeout(() => setStep(4), 860),
      setTimeout(() => setStep(5), 1300),
      setTimeout(() => setStep(6), 2200),
      setTimeout(() => setStep(7), 2950),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const isBig = multiplier >= 10;
  const rays = [0, 60, 120, 180, 240, 300];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="plinko-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50,
            pointerEvents: "none", borderRadius: 16, overflow: "hidden",
          }}
        >
          {/* Step 1: Screen white flash */}
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: "rgba(255,255,255,0.82)",
              animation: "plinkoWinFlash 0.55s ease-out forwards",
              pointerEvents: "none",
            }} />
          )}

          {/* Step 2: Golden vignette + light rays */}
          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 16,
                background: "radial-gradient(ellipse at 50% 45%, rgba(255,210,63,0.35) 0%, rgba(236,72,153,0.15) 50%, transparent 75%)",
                transition: "opacity 0.5s ease",
              }} />
              {/* Light rays */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle) => (
                  <div
                    key={angle}
                    style={{
                      position: "absolute",
                      width: 4,
                      height: "70%",
                      background: "linear-gradient(180deg, rgba(255,210,63,0.85) 0%, rgba(255,210,63,0.3) 50%, transparent 100%)",
                      transformOrigin: "50% 100%",
                      ["--ray-angle" as string]: `${angle}deg`,
                      animation: `plinkoLightRay 1.2s ease-out ${(angle / 360) * 0.3}s forwards`,
                      filter: "blur(2px)",
                      opacity: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 3: Multiplier slams in */}
          {step >= 3 && (
            <motion.div
              initial={{ y: -60, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 12 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 6 }}
            >
              <div style={{
                fontSize: 20, fontWeight: 800,
                fontFamily: "var(--font-orbitron), monospace",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: 2,
                textShadow: "0 0 10px rgba(255,255,255,0.5)",
                marginBottom: 4,
              }}>
                🎰 LANDED ON
              </div>
              <div style={{
                fontSize: isBig ? 72 : 58, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                background: isBig
                  ? "linear-gradient(90deg, #ffd23f, #ff5cb1, #a855f7, #00c2ff, #ffd23f)"
                  : "linear-gradient(90deg, #ffd23f, #ffffff, #ffd23f)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 ${isBig ? 28 : 18}px rgba(255,210,63,0.95))`,
                letterSpacing: 3,
                animation: step >= 7 ? "plinkoWinShimmer 1.8s ease-in-out infinite" : "none",
              }}>
                {multiplier}×
              </div>
            </motion.div>
          )}

          {/* Step 4 / 5: Profit counter rolls up */}
          {step >= 4 && step < 6 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ marginTop: 4, marginBottom: 10 }}
            >
              <PlinkoCountUp
                target={profit}
                asset={asset}
                onTick={() => {}}
              />
            </motion.div>
          )}
          {step >= 6 && (
            <div style={{
              fontSize: 22, fontWeight: 800,
              fontFamily: "var(--font-orbitron), monospace",
              color: "#00c2ff",
              textShadow: "0 0 16px rgba(0,194,255,0.9), 0 0 32px rgba(0,194,255,0.4)",
              letterSpacing: 1, marginBottom: 10,
            }}>
              +{profit.toFixed(4)} {asset}
            </div>
          )}

          {/* Step 6: YOU WIN! drops in slowly */}
          {step >= 6 && (
            <motion.div
              initial={{ y: -90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center", zIndex: 12 }}
            >
              <div style={{
                fontSize: 54, fontWeight: 900, letterSpacing: 4,
                fontFamily: "var(--font-orbitron), monospace",
                background: "linear-gradient(90deg, #ffd23f, #00c2ff, #ff5cb1, #a855f7, #ffd23f)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 24px rgba(255,210,63,0.95)) drop-shadow(0 0 48px rgba(255,210,63,0.4))",
                animation: step >= 7 ? "plinkoWinShimmer 2s ease-in-out infinite" : "none",
              }}>
                🏆 YOU WIN!
              </div>
            </motion.div>
          )}

          {/* Step 7: Confetti rain starts */}
          {step >= 7 && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              {["#ffd23f","#ec4899","#a855f7","#00c2ff","#ffffff","#f472b6","#c084fc","#fbbf24"].map((color, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0,
                  left: `${8 + i * 11.5}%`,
                  width: i % 3 === 0 ? 10 : i % 3 === 1 ? 8 : 6,
                  height: i % 3 === 0 ? 14 : i % 3 === 1 ? 10 : 8,
                  borderRadius: i % 2 === 0 ? "50%" : "2px",
                  background: color,
                  animation: `gfxConfetti${i % 8} ${1.4 + i * 0.14}s ease-in ${i * 0.09}s forwards`,
                  boxShadow: `0 0 4px ${color}`,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── PlinkoSlowLoseReveal — 5-step, ~2800ms ────────────────── */
export function PlinkoSlowLoseReveal({
  active, multiplier,
}: {
  active: boolean; multiplier: number;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 220),
      // Glitch flicker at step 2
      setTimeout(() => setGlitch(true),  630),
      setTimeout(() => setGlitch(false), 700),
      setTimeout(() => setGlitch(true),  740),
      setTimeout(() => setGlitch(false), 800),
      setTimeout(() => setGlitch(true),  840),
      setTimeout(() => setGlitch(false), 900),
      setTimeout(() => setStep(3), 640),
      setTimeout(() => setStep(4), 1050),
      setTimeout(() => setStep(5), 1700),
      setTimeout(() => setStep(6), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="plinko-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50,
            pointerEvents: "none", borderRadius: 16, overflow: "hidden",
            animation: step === 1 ? "plinkoHeavyShake 0.65s ease-out" : "none",
            filter: glitch ? "hue-rotate(180deg) brightness(1.6)" : "none",
            transition: "filter 0.04s",
          }}
        >
          {/* Step 1: Red vignette */}
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: "radial-gradient(ellipse at 50% 50%, rgba(255,20,20,0.55) 0%, rgba(180,0,0,0.25) 45%, transparent 72%)",
              animation: "redVignette 0.8s ease-out forwards",
            }} />
          )}

          {/* Step 2: 4 slow expanding red pulse rings */}
          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    borderRadius: "50%",
                    border: `2.5px solid rgba(255,30,30,${0.9 - i * 0.18})`,
                    animation: `plinkoLoseRing 950ms ease-out ${i * 210}ms forwards`,
                    width: 0, height: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Step 4: YOU LOSE slams down */}
          {step >= 4 && (
            <motion.div
              initial={{ y: -100, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.52, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 58, fontWeight: 900, letterSpacing: 4,
                fontFamily: "var(--font-orbitron), monospace",
                color: "#ff2020",
                textShadow: [
                  "0 0 30px rgba(255,20,20,0.95)",
                  "0 0 60px rgba(255,20,20,0.5)",
                  "0 6px 0 #7a0000",
                  "0 5px 0 #5a0000",
                  "0 4px 0 #3a0000",
                ].join(", "),
              }}>
                💀 YOU LOSE
              </div>
            </motion.div>
          )}

          {/* Step 5: Landing multiplier text */}
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                fontSize: 15, fontWeight: 700, color: "#ff6b6b",
                fontFamily: "var(--font-orbitron), monospace",
                textShadow: "0 0 8px rgba(255,100,100,0.6)",
                marginTop: 10, letterSpacing: 1,
              }}
            >
              You landed on {multiplier}× — House wins
            </motion.div>
          )}

          {/* Step 6: Better luck floats up */}
          {step >= 6 && (
            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              style={{
                fontSize: 13, color: "#b1bad3", fontWeight: 600,
                fontStyle: "italic", marginTop: 8,
              }}
            >
              Better luck next time…
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MINES GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

/* ─── MinesSlowWinReveal — 6-step, ~4500ms ──────────────────── */
export function MinesSlowWinReveal({
  active, multiplier, profit, asset, gemCount,
}: {
  active: boolean; multiplier: number; profit: number; asset: string; gemCount: number;
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 350),
      setTimeout(() => setStep(3), 1100),
      setTimeout(() => setStep(4), 1800),
      setTimeout(() => setStep(5), 2900),
      setTimeout(() => setStep(6), 3700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  // Animate profit counter
  useEffect(() => {
    if (step < 4 || !active) return;
    const dur = 950;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setCountVal(eased * profit);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isBig = multiplier >= 5;
  const rays  = [0, 51, 102, 153, 204, 255, 306];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="mines-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {/* Step 1: Board flash */}
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.75)",
              animation: "minesBoardFlash 0.5s ease-out forwards",
            }} />
          )}

          {/* Step 2: Golden vignette + rays */}
          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 50%, rgba(74,222,128,0.3) 0%, rgba(255,210,63,0.12) 50%, transparent 75%)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle) => (
                  <div key={angle} style={{
                    position: "absolute", width: 3, height: "70%",
                    background: "linear-gradient(180deg, rgba(74,222,128,0.9) 0%, rgba(255,210,63,0.4) 50%, transparent 100%)",
                    transformOrigin: "50% 100%",
                    transform: "rotate(" + angle + "deg)",
                    animation: "plinkoLightRay 1.4s ease-out " + (angle / 360 * 0.35) + "s forwards",
                    filter: "blur(2px)", opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {/* Step 3: Multiplier slams in */}
          {step >= 3 && (
            <motion.div
              initial={{ y: -70, scale: 0.4, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 4 }}
            >
              <div style={{
                fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.75)",
                fontFamily: "monospace", letterSpacing: 3, marginBottom: 4,
                textShadow: "0 0 10px rgba(255,255,255,0.4)",
              }}>CASHOUT</div>
              <div style={{
                fontSize: isBig ? 78 : 62, fontWeight: 900,
                fontFamily: "monospace",
                background: isBig
                  ? "linear-gradient(90deg,#4ade80,#ffd23f,#00c2ff,#4ade80)"
                  : "linear-gradient(90deg,#4ade80,#ffd23f,#4ade80)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 " + (isBig ? 28 : 18) + "px rgba(74,222,128,0.95))",
                letterSpacing: 2,
                animation: step >= 6 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                {multiplier.toFixed(2)}x
              </div>
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.5)",
                fontFamily: "monospace", marginTop: 2,
              }}>
                {gemCount} gem{gemCount !== 1 ? "s" : ""} collected
              </div>
            </motion.div>
          )}

          {/* Step 4/5: Profit counter */}
          {step >= 4 && step < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{ marginTop: 6, marginBottom: 8 }}
            >
              <div style={{
                fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                color: "#00c2ff",
                textShadow: "0 0 14px rgba(0,194,255,0.9)",
              }}>
                +{countVal.toFixed(4)} {asset}
              </div>
            </motion.div>
          )}
          {step >= 5 && (
            <div style={{
              fontSize: 20, fontWeight: 800, fontFamily: "monospace",
              color: "#00c2ff",
              textShadow: "0 0 14px rgba(0,194,255,0.9)",
              marginTop: 6, marginBottom: 8,
            }}>
              +{profit.toFixed(4)} {asset}
            </div>
          )}

          {/* Step 5: YOU WIN! */}
          {step >= 5 && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                background: "linear-gradient(90deg,#4ade80,#ffd23f,#00c2ff,#4ade80)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(74,222,128,0.95)) drop-shadow(0 0 44px rgba(74,222,128,0.4))",
                animation: step >= 6 ? "minesGemShimmer 2.2s linear infinite" : "none",
              }}>
                YOU WIN!
              </div>
            </motion.div>
          )}

          {/* Step 6: Confetti */}
          {step >= 6 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#4ade80","#ffd23f","#00c2ff","#ffffff","#86efac","#22c55e","#a3e635","#fbbf24"].map((c, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: (8 + i * 11.5) + "%",
                  width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 14 : 10,
                  borderRadius: i % 2 === 0 ? "50%" : "2px", background: c,
                  animation: "gfxConfetti" + (i % 8) + " " + (1.5 + i * 0.13) + "s ease-in " + (i * 0.08) + "s forwards",
                  boxShadow: "0 0 4px " + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── MinesSlowLoseReveal — 5-step, ~3500ms ─────────────────── */
export function MinesSlowLoseReveal({
  active, mineCount,
}: {
  active: boolean; mineCount: number;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 280),
      setTimeout(() => setGlitch(true),  700),
      setTimeout(() => setGlitch(false), 760),
      setTimeout(() => setGlitch(true),  800),
      setTimeout(() => setGlitch(false), 860),
      setTimeout(() => setGlitch(true),  900),
      setTimeout(() => setGlitch(false), 960),
      setTimeout(() => setStep(3), 1100),
      setTimeout(() => setStep(4), 1800),
      setTimeout(() => setStep(5), 2600),
      setTimeout(() => setStep(6), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="mines-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
            animation: step === 1 ? "minesBombShake 0.55s ease-out" : "none",
            filter: glitch ? "hue-rotate(160deg) brightness(1.7) saturate(2)" : "none",
            transition: "filter 0.04s",
          }}
        >
          {/* Red vignette */}
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.6) 0%, rgba(180,0,0,0.28) 45%, transparent 70%)",
            }} />
          )}

          {/* Shockwave rings */}
          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  position: "absolute", borderRadius: "50%",
                  border: "2.5px solid rgba(255,30,30," + (0.9 - i * 0.17) + ")",
                  animation: "minesShockRing 1000ms ease-out " + (i * 200) + "ms forwards",
                  width: 0, height: 0,
                }} />
              ))}
            </div>
          )}

          {/* BOOM slams in */}
          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.3, y: -80, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 68, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                color: "#ef4444",
                textShadow: [
                  "0 0 30px rgba(239,68,68,0.95)",
                  "0 0 60px rgba(239,68,68,0.5)",
                  "0 8px 0 #7a0000",
                  "0 6px 0 #5a0000",
                  "0 4px 0 #3a0000",
                ].join(","),
              }}>
                BOOM!
              </div>
            </motion.div>
          )}

          {/* YOU HIT A MINE */}
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              style={{
                fontSize: 17, fontWeight: 800, color: "#ff6b6b",
                fontFamily: "monospace",
                textShadow: "0 0 10px rgba(255,80,80,0.7)",
                marginTop: 10, letterSpacing: 2,
              }}
            >
              You hit a mine ({mineCount} on board)
            </motion.div>
          )}

          {/* Better luck */}
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ fontSize: 13, color: "#b1bad3", fontWeight: 600, fontStyle: "italic", marginTop: 8 }}
            >
              Better luck next time...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIMBO GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

export function LimboSlowWinReveal({
  active, rolled, target, profit, asset,
}: {
  active: boolean; rolled: number; target: number; profit: number; asset: string;
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 220),
      setTimeout(() => setStep(3), 550),
      setTimeout(() => setStep(4), 1550),
      setTimeout(() => setStep(5), 2100),
      setTimeout(() => setStep(6), 2700),
      setTimeout(() => setStep(7), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  useEffect(() => {
    if (step < 4 || !active) return;
    const dur = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t2 = Math.min(1, (now - start) / dur);
      setCountVal((1 - Math.pow(1 - t2, 3)) * profit);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isBig = rolled >= 5;
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="limbo-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.7)",
              animation: "limboFlashWhite 0.45s ease-out forwards",
            }} />
          )}

          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 50%, rgba(0,194,255,0.35) 0%, rgba(168,85,247,0.12) 50%, transparent 75%)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle) => (
                  <div key={angle} style={{
                    position: "absolute", width: 2, height: "65%",
                    background: "linear-gradient(180deg, rgba(0,194,255,0.95) 0%, rgba(168,85,247,0.4) 55%, transparent 100%)",
                    transformOrigin: "50% 100%",
                    transform: "rotate(" + angle + "deg)",
                    animation: "plinkoLightRay 1.5s ease-out " + (angle / 360 * 0.3) + "s forwards",
                    filter: "blur(1.5px)", opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ y: -110, scale: 0.55, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.82, ease: [0.22, 1.4, 0.36, 1] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 14, fontWeight: 600, letterSpacing: 4,
                color: "rgba(255,255,255,0.6)", fontFamily: "monospace",
                marginBottom: 6,
              }}>ROLLED</div>
              <div style={{
                fontSize: isBig ? 96 : 80, fontWeight: 900,
                fontFamily: "monospace", letterSpacing: 2,
                background: isBig
                  ? "linear-gradient(90deg,#00c2ff,#a855f7,#ffd23f,#00c2ff)"
                  : "linear-gradient(90deg,#00c2ff,#38bdf8,#00c2ff)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 " + (isBig ? 32 : 20) + "px rgba(0,194,255,0.95))",
                animation: step >= 7 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                {rolled.toFixed(2)}x
              </div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                fontSize: 13, color: "rgba(255,255,255,0.55)",
                fontFamily: "monospace", marginTop: 4, marginBottom: 2,
              }}
            >
              Beat {target}x target
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              style={{
                fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                color: "#00c2ff",
                textShadow: "0 0 14px rgba(0,194,255,0.9)",
                marginBottom: 8,
              }}
            >
              +{step >= 5 ? profit.toFixed(4) : countVal.toFixed(4)} {asset}
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                background: "linear-gradient(90deg,#00c2ff,#a855f7,#ffd23f,#00c2ff)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(0,194,255,0.95)) drop-shadow(0 0 44px rgba(168,85,247,0.4))",
                animation: step >= 7 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                YOU WIN!
              </div>
            </motion.div>
          )}

          {step >= 7 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#00c2ff","#a855f7","#ffd23f","#ffffff","#38bdf8","#c084fc","#06b6d4","#fbbf24"].map((c, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: (6 + i * 12) + "%",
                  width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 14 : 10,
                  borderRadius: i % 2 === 0 ? "50%" : "2px", background: c,
                  animation: "gfxConfetti" + (i % 8) + " " + (1.4 + i * 0.14) + "s ease-in " + (i * 0.07) + "s forwards",
                  boxShadow: "0 0 5px " + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LimboSlowLoseReveal({
  active, rolled, target,
}: {
  active: boolean; rolled: number; target: number;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 320),
      setTimeout(() => setGlitch(true),  800),
      setTimeout(() => setGlitch(false), 870),
      setTimeout(() => setGlitch(true),  920),
      setTimeout(() => setGlitch(false), 990),
      setTimeout(() => setStep(3), 1100),
      setTimeout(() => setStep(4), 1850),
      setTimeout(() => setStep(5), 2500),
      setTimeout(() => setStep(6), 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="limbo-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
            filter: glitch ? "hue-rotate(170deg) brightness(1.8) saturate(2)" : "none",
            transition: "filter 0.04s",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.55) 0%, rgba(160,0,0,0.25) 45%, transparent 70%)",
          }} />

          {step >= 2 && (
            <>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} style={{
                    position: "absolute", borderRadius: "50%",
                    border: "2.5px solid rgba(255,40,40," + (0.88 - i * 0.15) + ")",
                    animation: "limboShockRing 1050ms ease-out " + (i * 210) + "ms forwards",
                    width: 0, height: 0,
                  }} />
                ))}
              </div>

              <motion.div
                initial={{ y: -100, scale: 0.6, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.75, ease: [0.22, 1.3, 0.36, 1] }}
                style={{ textAlign: "center", zIndex: 10 }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 600, letterSpacing: 4,
                  color: "rgba(255,100,100,0.7)", fontFamily: "monospace", marginBottom: 6,
                }}>ROLLED</div>
                <div style={{
                  fontSize: 88, fontWeight: 900, fontFamily: "monospace",
                  color: "#ef4444",
                  textShadow: "0 0 28px rgba(239,68,68,0.95), 0 0 55px rgba(239,68,68,0.4)",
                  letterSpacing: 2,
                }}>
                  {rolled.toFixed(2)}x
                </div>
              </motion.div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 14, color: "rgba(255,120,120,0.8)",
                fontFamily: "monospace", marginTop: 6, letterSpacing: 1,
              }}
            >
              Needed {target.toFixed(2)}x to win
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.35, y: -60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", marginTop: 10 }}
            >
              <div style={{
                fontSize: 58, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace", color: "#ef4444",
                textShadow: [
                  "0 0 28px rgba(239,68,68,0.95)",
                  "0 0 55px rgba(239,68,68,0.5)",
                  "0 8px 0 #7a0000",
                  "0 6px 0 #5a0000",
                ].join(","),
              }}>
                YOU LOSE
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 13, color: "#b1bad3", fontStyle: "italic", marginTop: 8 }}
            >
              Better luck next time...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHEEL GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

export function WheelSlowWinReveal({
  active, multiplier, profit, asset,
}: {
  active: boolean; multiplier: number; profit: number; asset: string;
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 220),
      setTimeout(() => setStep(3), 550),
      setTimeout(() => setStep(4), 1050),
      setTimeout(() => setStep(5), 2000),
      setTimeout(() => setStep(6), 2700),
      setTimeout(() => setStep(7), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  useEffect(() => {
    if (step < 5 || !active) return;
    const dur = 850;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t2 = Math.min(1, (now - start) / dur);
      setCountVal((1 - Math.pow(1 - t2, 3)) * profit);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isBig = multiplier >= 3;
  const rays = [0, 40, 80, 120, 160, 200, 240, 280, 320];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="wheel-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.72)",
              animation: "wheelWinFlash 0.45s ease-out forwards",
            }} />
          )}

          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 50%, rgba(255,210,63,0.38) 0%, rgba(255,92,177,0.15) 50%, transparent 75%)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle, ri) => (
                  <div key={angle} style={{
                    position: "absolute", width: 3, height: "68%",
                    background: "linear-gradient(180deg, rgba(255,210,63,0.95) 0%, rgba(255,92,177,0.5) 55%, transparent 100%)",
                    transformOrigin: "50% 100%",
                    transform: "rotate(" + angle + "deg)",
                    animation: "plinkoLightRay 1.5s ease-out " + (ri * 0.04) + "s forwards",
                    filter: "blur(2px)", opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 6 }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: 4,
                color: "rgba(255,255,255,0.7)", fontFamily: "monospace", marginBottom: 6,
              }}>MULTIPLIER</div>
              <div style={{
                fontSize: isBig ? 96 : 78, fontWeight: 900, fontFamily: "monospace",
                background: isBig
                  ? "linear-gradient(90deg,#ffd23f,#ff5cb1,#00c2ff,#ffd23f)"
                  : "linear-gradient(90deg,#ffd23f,#fbbf24,#ffd23f)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 " + (isBig ? 30 : 18) + "px rgba(255,210,63,0.95))",
                letterSpacing: 2,
                animation: step >= 7 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                {multiplier.toFixed(2)}x
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                color: "#ffd23f",
                textShadow: "0 0 14px rgba(255,210,63,0.9)",
                marginBottom: 8,
              }}
            >
              +{step >= 6 ? profit.toFixed(4) : countVal.toFixed(4)} {asset}
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                background: "linear-gradient(90deg,#ffd23f,#ff5cb1,#00c2ff,#ffd23f)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(255,210,63,0.95)) drop-shadow(0 0 44px rgba(255,92,177,0.4))",
                animation: step >= 7 ? "minesGemShimmer 2.2s linear infinite" : "none",
              }}>
                YOU WIN!
              </div>
            </motion.div>
          )}

          {step >= 7 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#ffd23f","#ff5cb1","#00c2ff","#4ade80","#ffffff","#a855f7","#fbbf24","#f472b6"].map((c, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: (5 + i * 12.5) + "%",
                  width: i % 3 === 0 ? 11 : 7, height: i % 3 === 0 ? 15 : 10,
                  borderRadius: i % 2 === 0 ? "50%" : "2px", background: c,
                  animation: "gfxConfetti" + (i % 8) + " " + (1.4 + i * 0.13) + "s ease-in " + (i * 0.07) + "s forwards",
                  boxShadow: "0 0 5px " + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function WheelSlowLoseReveal({
  active,
}: {
  active: boolean;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 310),
      setTimeout(() => setGlitch(true),  750),
      setTimeout(() => setGlitch(false), 820),
      setTimeout(() => setGlitch(true),  870),
      setTimeout(() => setGlitch(false), 940),
      setTimeout(() => setStep(3), 1050),
      setTimeout(() => setStep(4), 1800),
      setTimeout(() => setStep(5), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="wheel-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
            filter: glitch ? "hue-rotate(170deg) brightness(1.8) saturate(2)" : "none",
            transition: "filter 0.04s",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.5) 0%, rgba(160,0,0,0.22) 45%, transparent 70%)",
          }} />

          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{
                  position: "absolute", borderRadius: "50%",
                  border: "2.5px solid rgba(255,40,40," + (0.88 - i * 0.2) + ")",
                  animation: "wheelShockRing 1050ms ease-out " + (i * 220) + "ms forwards",
                  width: 0, height: 0,
                }} />
              ))}
            </div>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.48, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 100, fontWeight: 900, fontFamily: "monospace",
                color: "#ef4444", letterSpacing: 2,
                textShadow: "0 0 30px rgba(239,68,68,0.95), 0 0 60px rgba(239,68,68,0.4), 0 8px 0 #7a0000",
              }}>0x</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.3, y: -60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace", color: "#ef4444",
                textShadow: "0 0 28px rgba(239,68,68,0.95), 0 0 55px rgba(239,68,68,0.5), 0 8px 0 #7a0000, 0 6px 0 #5a0000",
              }}>YOU LOSE</div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 13, color: "#b1bad3", fontStyle: "italic", marginTop: 10 }}
            >
              Better luck next time...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOWER GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

export function TowerSlowWinReveal({
  active, multiplier, profit, asset, rowsClimbed,
}: {
  active: boolean; multiplier: number; profit: number; asset: string; rowsClimbed: number;
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 260),
      setTimeout(() => setStep(3), 720),
      setTimeout(() => setStep(4), 1250),
      setTimeout(() => setStep(5), 2100),
      setTimeout(() => setStep(6), 2900),
      setTimeout(() => setStep(7), 3700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  useEffect(() => {
    if (step < 5 || !active) return;
    const dur = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t2 = Math.min(1, (now - start) / dur);
      setCountVal((1 - Math.pow(1 - t2, 3)) * profit);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isBig = multiplier >= 10;
  const rays  = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="tower-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,220,120,0.75)",
              animation: "towerWinFlash 0.48s ease-out forwards",
            }} />
          )}

          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 10%, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0.15) 40%, transparent 70%)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle, ri) => (
                  <div key={angle} style={{
                    position: "absolute", width: 3, height: "65%",
                    background: "linear-gradient(180deg, rgba(245,158,11,0.95) 0%, rgba(255,210,63,0.5) 55%, transparent 100%)",
                    transformOrigin: "50% 100%",
                    transform: "rotate(" + angle + "deg)",
                    animation: "plinkoLightRay 1.5s ease-out " + (ri * 0.04) + "s forwards",
                    filter: "blur(2px)", opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.5, y: -40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 16 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 8 }}
            >
              <div style={{
                fontSize: 28, animation: "towerTopReach 0.6s ease-out",
              }}>👑</div>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 4,
                color: "rgba(255,255,255,0.65)", fontFamily: "monospace",
                marginBottom: 4,
              }}>{rowsClimbed} ROW{rowsClimbed !== 1 ? "S" : ""} CLIMBED</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 4 }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: 4,
                color: "rgba(255,255,255,0.7)", fontFamily: "monospace", marginBottom: 4,
              }}>MULTIPLIER</div>
              <div style={{
                fontSize: isBig ? 88 : 72, fontWeight: 900, fontFamily: "monospace",
                background: isBig
                  ? "linear-gradient(90deg,#f59e0b,#ffd23f,#00c2ff,#f59e0b)"
                  : "linear-gradient(90deg,#f59e0b,#ffd23f,#f59e0b)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 " + (isBig ? 28 : 18) + "px rgba(245,158,11,0.95))",
                letterSpacing: 2,
                animation: step >= 7 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                {multiplier.toFixed(2)}x
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                color: "#ffd23f",
                textShadow: "0 0 14px rgba(255,210,63,0.9)",
                marginBottom: 8,
              }}
            >
              +{step >= 6 ? profit.toFixed(4) : countVal.toFixed(4)} {asset}
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                background: "linear-gradient(90deg,#f59e0b,#ffd23f,#00c2ff,#f59e0b)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(245,158,11,0.95)) drop-shadow(0 0 44px rgba(245,158,11,0.4))",
                animation: step >= 7 ? "minesGemShimmer 2.2s linear infinite" : "none",
              }}>
                YOU WIN!
              </div>
            </motion.div>
          )}

          {step >= 7 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#f59e0b","#ffd23f","#00c2ff","#4ade80","#ffffff","#fbbf24","#d97706","#f472b6"].map((c, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: (5 + i * 12.5) + "%",
                  width: i % 3 === 0 ? 11 : 7, height: i % 3 === 0 ? 15 : 10,
                  borderRadius: i % 2 === 0 ? "50%" : "2px", background: c,
                  animation: "gfxConfetti" + (i % 8) + " " + (1.4 + i * 0.13) + "s ease-in " + (i * 0.07) + "s forwards",
                  boxShadow: "0 0 5px " + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TowerSlowLoseReveal({
  active, failRow, difficulty,
}: {
  active: boolean; failRow: number; difficulty: string;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 310),
      setTimeout(() => setGlitch(true),  850),
      setTimeout(() => setGlitch(false), 920),
      setTimeout(() => setGlitch(true),  970),
      setTimeout(() => setGlitch(false), 1040),
      setTimeout(() => setGlitch(true),  1090),
      setTimeout(() => setGlitch(false), 1160),
      setTimeout(() => setStep(3), 1280),
      setTimeout(() => setStep(4), 2050),
      setTimeout(() => setStep(5), 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="tower-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
            filter: glitch ? "hue-rotate(170deg) brightness(1.8) saturate(2)" : "none",
            transition: "filter 0.04s",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.55) 0%, rgba(160,0,0,0.25) 45%, transparent 70%)",
          }} />

          {step >= 2 && (
            <>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    position: "absolute", borderRadius: "50%",
                    border: "2.5px solid rgba(255,40,40," + (0.88 - i * 0.2) + ")",
                    animation: "towerShockRing 1050ms ease-out " + (i * 220) + "ms forwards",
                    width: 0, height: 0,
                  }} />
                ))}
              </div>
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                style={{ fontSize: 56, animation: "towerFailShatter 0.5s ease-out", zIndex: 10 }}
              >
                💥
              </motion.div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.35, y: -55, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.52, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 74, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace", color: "#ef4444",
                textShadow: "0 0 30px rgba(239,68,68,0.95), 0 0 60px rgba(239,68,68,0.5), 0 8px 0 #7a0000, 0 6px 0 #5a0000",
              }}>BUST!</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 14, color: "rgba(255,110,110,0.85)",
                fontFamily: "monospace", marginTop: 8, letterSpacing: 1,
              }}
            >
              Hit a bomb on row {failRow + 1} — {difficulty} mode
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 13, color: "#b1bad3", fontStyle: "italic", marginTop: 8 }}
            >
              Better luck next time...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KENO GAME EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

export function KenoSlowWinReveal({
  active, matches, multiplier, profit, asset,
}: {
  active: boolean; matches: number; multiplier: number; profit: number; asset: string;
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 210),
      setTimeout(() => setStep(3), 620),
      setTimeout(() => setStep(4), 1130),
      setTimeout(() => setStep(5), 1950),
      setTimeout(() => setStep(6), 2750),
      setTimeout(() => setStep(7), 3550),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  useEffect(() => {
    if (step < 5 || !active) return;
    const dur = 860;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t2 = Math.min(1, (now - start) / dur);
      setCountVal((1 - Math.pow(1 - t2, 3)) * profit);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isBig = multiplier >= 5;
  const rays = [0, 40, 80, 120, 160, 200, 240, 280, 320];

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="keno-win-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
          }}
        >
          {step >= 1 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(200,255,220,0.78)",
              animation: "kenoWinFlash 0.45s ease-out forwards",
            }} />
          )}

          {step >= 2 && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.42) 0%, rgba(20,184,166,0.15) 50%, transparent 75%)",
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rays.map((angle, ri) => (
                  <div key={angle} style={{
                    position: "absolute", width: 3, height: "65%",
                    background: "linear-gradient(180deg, rgba(34,197,94,0.95) 0%, rgba(74,222,128,0.5) 55%, transparent 100%)",
                    transformOrigin: "50% 100%",
                    transform: "rotate(" + angle + "deg)",
                    animation: "plinkoLightRay 1.5s ease-out " + (ri * 0.04) + "s forwards",
                    filter: "blur(2px)", opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.3, y: -40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 16 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 8 }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: 4,
                color: "rgba(255,255,255,0.65)", fontFamily: "monospace",
                marginBottom: 4,
              }}>MATCHED</div>
              <div style={{
                fontSize: 80, fontWeight: 900, fontFamily: "monospace",
                color: "#22c55e", letterSpacing: 2,
                textShadow: "0 0 28px rgba(34,197,94,0.95), 0 0 55px rgba(34,197,94,0.4)",
              }}>{matches}</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              style={{ textAlign: "center", zIndex: 10, marginBottom: 4 }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: 4,
                color: "rgba(255,255,255,0.65)", fontFamily: "monospace", marginBottom: 4,
              }}>MULTIPLIER</div>
              <div style={{
                fontSize: isBig ? 88 : 68, fontWeight: 900, fontFamily: "monospace",
                background: isBig
                  ? "linear-gradient(90deg,#22c55e,#ffd23f,#00c2ff,#22c55e)"
                  : "linear-gradient(90deg,#22c55e,#4ade80,#22c55e)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 " + (isBig ? 28 : 18) + "px rgba(34,197,94,0.95))",
                animation: step >= 7 ? "minesGemShimmer 2s linear infinite" : "none",
              }}>
                {multiplier.toFixed(2)}x
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: 19, fontWeight: 800, fontFamily: "monospace",
                color: "#4ade80",
                textShadow: "0 0 14px rgba(74,222,128,0.9)",
                marginBottom: 8,
              }}
            >
              +{step >= 6 ? profit.toFixed(4) : countVal.toFixed(4)} {asset}
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4, fontFamily: "monospace",
                background: "linear-gradient(90deg,#22c55e,#ffd23f,#00c2ff,#22c55e)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 22px rgba(34,197,94,0.95)) drop-shadow(0 0 44px rgba(34,197,94,0.4))",
                animation: step >= 7 ? "minesGemShimmer 2.2s linear infinite" : "none",
              }}>YOU WIN!</div>
            </motion.div>
          )}

          {step >= 7 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#22c55e","#ffd23f","#00c2ff","#4ade80","#ffffff","#a855f7","#fbbf24","#f472b6"].map((c, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: (5 + i * 12.5) + "%",
                  width: i % 3 === 0 ? 11 : 7, height: i % 3 === 0 ? 15 : 10,
                  borderRadius: i % 2 === 0 ? "50%" : "2px", background: c,
                  animation: "gfxConfetti" + (i % 8) + " " + (1.4 + i * 0.13) + "s ease-in " + (i * 0.07) + "s forwards",
                  boxShadow: "0 0 5px " + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function KenoSlowLoseReveal({
  active,
}: {
  active: boolean;
}) {
  const [step, setStep] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) { setStep(0); setGlitch(false); return; }
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 310),
      setTimeout(() => setGlitch(true),  760),
      setTimeout(() => setGlitch(false), 830),
      setTimeout(() => setGlitch(true),  880),
      setTimeout(() => setGlitch(false), 950),
      setTimeout(() => setStep(3), 1180),
      setTimeout(() => setStep(4), 1950),
      setTimeout(() => setStep(5), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="keno-lose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{
            position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 60,
            pointerEvents: "none",
            filter: glitch ? "hue-rotate(170deg) brightness(1.8) saturate(2)" : "none",
            transition: "filter 0.04s",
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.5) 0%, rgba(160,0,0,0.22) 45%, transparent 70%)",
          }} />

          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  position: "absolute", borderRadius: "50%",
                  border: "2.5px solid rgba(255,40,40," + (0.88 - i * 0.2) + ")",
                  animation: "kenoShockRing 1050ms ease-out " + (i * 220) + "ms forwards",
                  width: 0, height: 0,
                }} />
              ))}
            </div>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.48, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: 44, fontWeight: 900, fontFamily: "monospace",
                color: "#ef4444", letterSpacing: 2,
                textShadow: "0 0 22px rgba(239,68,68,0.95), 0 0 44px rgba(239,68,68,0.4)",
              }}>0 MATCHES</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.3, y: -55, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
              style={{ textAlign: "center", marginTop: 8 }}
            >
              <div style={{
                fontSize: 52, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace", color: "#ef4444",
                textShadow: "0 0 28px rgba(239,68,68,0.95), 0 0 55px rgba(239,68,68,0.5), 0 8px 0 #7a0000",
              }}>YOU LOSE</div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 13, color: "#b1bad3", fontStyle: "italic", marginTop: 10 }}
            >
              Better luck next time...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLACKJACK PREMIUM COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ─── Chip Rain (shows on win) ───────────────────────────────── */
export function BJChipRain({ active }: { active: boolean }) {
  if (!active) return null;
  const chips = Array.from({ length: 14 }, (_, i) => ({
    left: `${4 + i * 7}%`,
    delay: i * 0.09,
    dur: 1.4 + (i % 4) * 0.22,
    rot: (i % 2 === 0 ? 1 : -1) * (320 + i * 60),
    size: 22 + (i % 3) * 6,
    color: i % 3 === 0 ? "#FFD23F" : i % 3 === 1 ? "#00ff88" : "#a855f7",
    label: i % 4 === 0 ? "$" : i % 4 === 1 ? "♠" : i % 4 === 2 ? "♥" : "★",
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 28 }}>
      {chips.map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: "-30px", left: c.left,
          width: c.size, height: c.size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${c.color}ee 0%, ${c.color}88 55%, ${c.color}44 100%)`,
          border: `2px solid ${c.color}`,
          boxShadow: `0 0 10px ${c.color}88, inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: c.size * 0.4, color: "rgba(0,0,0,0.7)", fontWeight: 900,
          ["--chip-rot" as string]: `${c.rot}deg`,
          animation: `bjChipRain ${c.dur}s ease-in ${c.delay}s forwards`,
          willChange: "transform",
        }}>
          {c.label}
        </div>
      ))}
    </div>
  );
}

/* ─── Blackjack Win Reveal (slow 2.8s cinematic sequence) ────── */
export function BlackjackWinReveal({ active, isBlackjack, payout, asset }: {
  active: boolean; isBlackjack?: boolean; payout?: number; asset?: string;
}) {
  const [step, setStep] = useState(0);
  const [countedPayout, setCountedPayout] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); setCountedPayout(0); return; }
    // Slow-motion reveal sequence: 2.8 s total
    const t1 = setTimeout(() => setStep(1), 60);   // white flash
    const t2 = setTimeout(() => setStep(2), 450);  // golden bloom
    const t3 = setTimeout(() => setStep(3), 950);  // title spring in (slow spring)
    const t4 = setTimeout(() => setStep(4), 1550); // payout counter
    const t5 = setTimeout(() => setStep(5), 2050); // chip rain
    const t6 = setTimeout(() => setStep(6), 2550); // sub-text
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, [active]);

  // Count up payout from 0
  useEffect(() => {
    if (step < 4 || payout === undefined) return;
    const target = payout;
    const duration = 700;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, target);
      setCountedPayout(current);
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [step, payout]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="bj-win-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* White flash */}
          {step === 1 && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: "rgba(255,255,255,0.75)",
              animation: "bjFlashWhite 0.35s ease-out forwards",
            }} />
          )}

          {/* Slow golden bloom from center */}
          {step >= 2 && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: isBlackjack
                ? "radial-gradient(ellipse at 50% 45%, rgba(255,215,0,0.55) 0%, rgba(168,85,247,0.2) 40%, rgba(0,194,255,0.15) 65%, transparent 80%)"
                : "radial-gradient(ellipse at 50% 45%, rgba(255,215,0,0.48) 0%, rgba(0,255,136,0.2) 50%, transparent 78%)",
              animation: "bjSlowWinBloom 2.8s ease-out forwards",
            }} />
          )}

          {/* Ambient shimmer particles */}
          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: `${15 + (i % 4) * 20}%`,
                  left: `${5 + i * 8.5}%`,
                  width: i % 3 === 0 ? 5 : 3,
                  height: i % 3 === 0 ? 5 : 3,
                  borderRadius: "50%",
                  background: i % 3 === 0 ? "#FFD23F" : i % 3 === 1 ? "#00ff88" : "#ffffff",
                  boxShadow: `0 0 8px ${i % 3 === 0 ? "#FFD23F" : "#00ff88"}`,
                  animation: `gfxParticle${i % 20} ${1.8 + i * 0.18}s ease-out ${i * 0.07}s both`,
                }} />
              ))}
            </div>
          )}

          {/* Pulse rings */}
          {step >= 2 && [0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute",
              width: 100, height: 100, borderRadius: "50%",
              border: `2px solid rgba(255,215,0,${0.75 - i * 0.2})`,
              animation: `bjPulseRing2 2.0s ease-out ${i * 0.38}s forwards`,
              opacity: 0,
            }} />
          ))}

          {/* BLACKJACK rainbow ring — slow 2.2 s */}
          {isBlackjack && step >= 2 && (
            <>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                borderRadius: "50%", border: "4px solid #FFD700",
                animation: "bjRainbowRing 2.2s ease-out forwards",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                borderRadius: "50%", border: "3px solid #a855f7",
                animation: "bjRainbowRing 2.2s ease-out 0.35s forwards",
                pointerEvents: "none",
                opacity: 0,
              }} />
            </>
          )}

          {/* Title — slow spring in */}
          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.35, y: 55, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 16 }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: isBlackjack ? 52 : 46, fontWeight: 900,
                fontFamily: "'Orbitron', monospace",
                background: isBlackjack
                  ? "linear-gradient(90deg, #FFD700, #ff5cb1, #a855f7, #00c2ff, #FFD700)"
                  : "linear-gradient(90deg, #FFD23F, #00ff88, #FFD23F)",
                backgroundSize: "220% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 30px rgba(255,215,0,0.95))",
                animation: "shimmer 2.2s linear infinite",
                letterSpacing: isBlackjack ? 5 : 3,
                lineHeight: 1.1,
              }}>
                {isBlackjack ? "♠ BLACKJACK!" : "🏆 YOU WIN!"}
              </div>
            </motion.div>
          )}

          {/* Payout counter */}
          {step >= 4 && payout !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              style={{ marginTop: 14, zIndex: 10 }}
            >
              <div style={{
                fontSize: 26, fontWeight: 800,
                color: "#00ff88",
                textShadow: "0 0 20px rgba(0,255,136,0.95), 0 0 42px rgba(0,255,136,0.45)",
                fontFamily: "'Orbitron', monospace",
                letterSpacing: 1.5,
                background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)",
                padding: "6px 18px", borderRadius: 20,
                border: "1px solid rgba(0,255,136,0.35)",
              }}>
                +{countedPayout.toFixed(6)} {asset}
              </div>
            </motion.div>
          )}

          {/* Chip rain */}
          {step >= 5 && <BJChipRain active />}

          {/* Sub-text */}
          {step >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                fontSize: 12, color: "#b1bad3", fontWeight: 600,
                marginTop: 10, letterSpacing: 1.8, textTransform: "uppercase", zIndex: 10,
              }}
            >
              {isBlackjack ? "Natural Blackjack • 3:2 Payout" : "Congratulations!"}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Blackjack Lose/Bust Reveal (slow 2.2s sequence) ─────────── */
export function BlackjackLoseReveal({ active, isBust, bustWho }: {
  active: boolean; isBust?: boolean; bustWho?: "player" | "dealer";
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 80);   // red vignette creeps in
    const t2 = setTimeout(() => setStep(2), 550);  // title drops (slow spring)
    const t3 = setTimeout(() => setStep(3), 1100); // sub-label
    const t4 = setTimeout(() => setStep(4), 1600); // shock ring
    const t5 = setTimeout(() => setStep(5), 2100); // flavor text
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [active]);

  const isPlayerBust = isBust && bustWho === "player";

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div
          key="bj-lose-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
            animation: isPlayerBust && step === 1 ? "bjBustShake 0.65s ease-out" : "none",
          }}
        >
          {/* Slow red vignette from edges (800 ms creep) */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 50%, transparent 22%, rgba(200,0,0,0.42) 100%)",
            animation: "bjSlowLoseFade 2.2s ease-out forwards",
          }} />

          {/* Slow desaturation overlay */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "rgba(0,0,0,0.0)",
            animation: "bjArenaDesaturate 1.6s ease-out forwards",
            mixBlendMode: "color",
          }} />

          {/* Slow red pulse rings */}
          {step >= 1 && [0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute",
              width: 120, height: 120, borderRadius: "50%",
              border: `2px solid rgba(255,40,40,${0.65 - i * 0.18})`,
              animation: `bjPulseRing2 2.2s ease-out ${i * 0.42}s forwards`,
              opacity: 0,
            }} />
          ))}

          {/* Title — slow spring drop from top */}
          {step >= 2 && (
            <motion.div
              initial={{ scale: 0.55, y: -65, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
              style={{ textAlign: "center", zIndex: 10 }}
            >
              <div style={{
                fontSize: isPlayerBust ? 48 : 44, fontWeight: 900,
                fontFamily: "'Orbitron', monospace",
                color: "#ff3030",
                textShadow: "0 0 32px rgba(255,48,48,0.98), 0 0 65px rgba(255,48,48,0.45), 0 6px 0 #7a0000",
                letterSpacing: 4,
              }}>
                {isPlayerBust ? "💥 BUST!" : "💀 YOU LOSE"}
              </div>
            </motion.div>
          )}

          {/* YOU LOSE sub-label for bust */}
          {step >= 3 && isPlayerBust && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ marginTop: 10, zIndex: 10 }}
            >
              <div style={{
                fontSize: 30, fontWeight: 900, color: "#ff6060",
                fontFamily: "'Orbitron', monospace",
                textShadow: "0 0 20px rgba(255,80,80,0.75)",
                letterSpacing: 2.5,
                background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
                padding: "4px 16px", borderRadius: 16,
                border: "1px solid rgba(255,48,48,0.3)",
              }}>
                YOU LOSE
              </div>
            </motion.div>
          )}

          {/* Red shock ring */}
          {step >= 4 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              borderRadius: "50%", border: "3px solid rgba(255,40,40,0.8)",
              animation: "minesShockRing 1.4s ease-out forwards",
              pointerEvents: "none",
            }} />
          )}

          {/* Flavor text */}
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              style={{
                fontSize: 12, color: "#b1bad3", fontWeight: 600,
                marginTop: 14, letterSpacing: 2, textTransform: "uppercase", zIndex: 10,
              }}
            >
              Better luck next time
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Premium Blackjack Arena Background ─────────────────────── */
export function BlackjackArenaBackground({ win }: { win: boolean | null }) {
  const arcAnim = win === true ? "bjWinArcGlow 1.6s ease-in-out infinite"
    : win === false ? "bjLoseArcGlow 1.8s ease-in-out infinite"
    : "bjGoldArcGlow 4s ease-in-out infinite";

  const suits = ["♠", "♥", "♦", "♣"];
  const suitPositions = [
    { top: "12%", left: "6%", dur: 7.5, delay: 0 },
    { top: "18%", right: "8%", dur: 9.2, delay: 1.2 },
    { top: "60%", left: "4%", dur: 8.0, delay: 2.4 },
    { top: "65%", right: "5%", dur: 10.0, delay: 0.6 },
    { top: "38%", left: "14%", dur: 8.8, delay: 3.0 },
    { top: "42%", right: "12%", dur: 7.2, delay: 1.8 },
    { top: "80%", left: "22%", dur: 9.5, delay: 0.3 },
    { top: "78%", right: "20%", dur: 8.4, delay: 2.1 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", animation: "bjTableBreath 5s ease-in-out infinite" }}>

      {/* === FELT TEXTURE LAYERS === */}
      {/* Primary suede dot pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(0,255,136,0.12) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        opacity: 0.55,
      }} />
      {/* Diagonal weave lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(0,180,80,0.04) 0px, rgba(0,180,80,0.04) 1px, transparent 1px, transparent 10px)",
        opacity: 0.7,
      }} />

      {/* === NEBULA AMBIENCE === */}
      {/* Rich emerald center nebula */}
      <div style={{
        position: "absolute", top: "20%", left: "18%",
        width: "64%", height: "64%",
        background: "radial-gradient(ellipse, rgba(0,220,100,0.22) 0%, rgba(0,120,60,0.08) 55%, transparent 82%)",
        filter: "blur(55px)",
        animation: "nebulaPulse 7s ease-in-out infinite",
        borderRadius: "50%",
        transition: "background 1s ease",
      }} />
      {/* Gold accent nebula top-right */}
      <div style={{
        position: "absolute", top: "-6%", right: "-6%",
        width: "42%", height: "42%",
        background: win === true
          ? "radial-gradient(ellipse, rgba(255,215,0,0.38) 0%, transparent 70%)"
          : "radial-gradient(ellipse, rgba(200,160,0,0.14) 0%, transparent 70%)",
        filter: "blur(50px)",
        animation: "nebulaPulse 9s ease-in-out 2s infinite",
        borderRadius: "50%",
        transition: "background 1.2s ease",
      }} />
      {/* Cyan accent bottom-left */}
      <div style={{
        position: "absolute", bottom: "-5%", left: "0%",
        width: "36%", height: "36%",
        background: "radial-gradient(ellipse, rgba(0,194,255,0.13) 0%, transparent 70%)",
        filter: "blur(42px)",
        animation: "nebulaPulse 11s ease-in-out 4s infinite",
        borderRadius: "50%",
      }} />
      {/* Magenta accent top-left */}
      <div style={{
        position: "absolute", top: "5%", left: "-5%",
        width: "30%", height: "30%",
        background: "radial-gradient(ellipse, rgba(255,92,177,0.1) 0%, transparent 70%)",
        filter: "blur(38px)",
        animation: "nebulaPulse 8s ease-in-out 6s infinite",
        borderRadius: "50%",
      }} />

      {/* === SPOTLIGHT CONES (3 swaying) === */}
      {/* Center spotlight — amber/gold */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        width: 300, height: "70%",
        background: "linear-gradient(180deg, rgba(255,210,63,0.18) 0%, rgba(255,180,0,0.06) 55%, transparent 100%)",
        clipPath: "polygon(22% 0%, 78% 0%, 92% 100%, 8% 100%)",
        animation: "bjSpotSway1 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      {/* Left spotlight — sapphire */}
      <div style={{
        position: "absolute", top: 0, left: "18%",
        width: 180, height: "55%",
        background: "linear-gradient(180deg, rgba(0,194,255,0.14) 0%, transparent 100%)",
        clipPath: "polygon(18% 0%, 82% 0%, 96% 100%, 4% 100%)",
        animation: "bjSpotSway2 6.5s ease-in-out 1.2s infinite",
        pointerEvents: "none",
      }} />
      {/* Right spotlight — magenta */}
      <div style={{
        position: "absolute", top: 0, right: "18%",
        width: 180, height: "55%",
        background: "linear-gradient(180deg, rgba(255,92,177,0.12) 0%, transparent 100%)",
        clipPath: "polygon(18% 0%, 82% 0%, 96% 100%, 4% 100%)",
        animation: "bjSpotSway3 7s ease-in-out 2.8s infinite",
        pointerEvents: "none",
      }} />

      {/* === FLOATING SUIT SYMBOLS === */}
      {suitPositions.map((pos, i) => (
        <div key={i} style={{
          position: "absolute",
          ...pos as any,
          fontSize: 28 + (i % 3) * 8,
          color: i % 2 === 0 ? "#00ff88" : i % 4 === 1 ? "#ff5cb1" : "#FFD23F",
          animation: `bjSuitDrift ${pos.dur}s ease-in-out ${pos.delay}s infinite`,
          userSelect: "none",
          filter: `drop-shadow(0 0 8px currentColor)`,
        }}>
          {suits[i % 4]}
        </div>
      ))}

      {/* === GOLD TABLE ARC (player zone) === */}
      <div style={{
        position: "absolute", bottom: "-14px", left: "8%", right: "8%", height: "58%",
        border: "2px solid",
        borderRadius: "0 0 320px 320px",
        borderTop: "none",
        animation: arcAnim,
        transition: "border-color 0.7s ease",
        pointerEvents: "none",
      }} />

      {/* === HOLOGRAPHIC TABLE DIVIDER === */}
      <div style={{
        position: "absolute", top: "48%", left: "3%", right: "3%", height: "1.5px",
        background: "linear-gradient(90deg, transparent, #00ff88, #FFD23F, #00c2ff, #ff5cb1, #00ff88, transparent)",
        backgroundSize: "300% 100%",
        animation: "bjDividerShift 3.5s linear infinite",
        filter: "blur(0.5px)",
        opacity: 0.55,
      }} />

      {/* === BOTTOM HORIZON GLOW === */}
      <div style={{
        position: "absolute", bottom: 0, left: "5%", right: "5%", height: "2px",
        background: win === true
          ? "linear-gradient(90deg, transparent, rgba(255,215,0,0.95), rgba(0,255,136,0.7), rgba(255,215,0,0.95), transparent)"
          : "linear-gradient(90deg, transparent, rgba(0,255,136,0.5), rgba(0,194,255,0.35), rgba(0,255,136,0.5), transparent)",
        filter: "blur(2px)",
        transition: "background 0.8s ease",
      }} />
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   DRAGON TIGER GAME EFFECTS
═══════════════════════════════════════════════════════════════ */

/* ─── Dragon Tiger Arena Background ─────────────────────────── */
export function DragonTigerBackground3D() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Dragon side — lava ember nebula */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, right: "50%",
        background: "radial-gradient(ellipse at 20% 35%, rgba(255,80,0,0.26) 0%, rgba(200,20,0,0.12) 45%, transparent 70%)",
        filter: "blur(28px)",
        animation: "gfxPulse 4.2s ease-in-out infinite",
      }} />
      {/* Dragon — ember float particles */}
      {[...Array(8)].map((_, i) => (
        <div key={`ember-${i}`} style={{
          position: "absolute",
          left: `${4 + i * 5.5}%`,
          bottom: `${8 + (i % 3) * 14}%`,
          width: i % 2 === 0 ? 5 : 3,
          height: i % 2 === 0 ? 5 : 3,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#ff6600" : i % 3 === 1 ? "#ffd23f" : "#ff2200",
          boxShadow: `0 0 8px ${i % 3 === 0 ? "#ff6600" : "#ffd23f"}`,
          animation: `dtEmberFloat ${2.4 + i * 0.45}s ease-out ${i * 0.28}s infinite`,
          ["--ex" as string]: `${(i % 2 === 0 ? 1 : -1) * (8 + i * 3)}px`,
        }} />
      ))}
      {/* Dragon — bottom lava glow line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, width: "50%", height: 3,
        background: "linear-gradient(90deg, transparent, rgba(255,80,0,0.85), rgba(255,200,0,0.65), transparent)",
        filter: "blur(3px)",
      }} />
      {/* Dragon — large heat radial */}
      <div style={{
        position: "absolute", top: "25%", left: "8%",
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,60,0,0.18) 0%, transparent 70%)",
        filter: "blur(45px)",
        animation: "gfxFlame 3.2s ease-in-out infinite",
      }} />

      {/* Tiger side — electric lightning nebula */}
      <div style={{
        position: "absolute", top: 0, left: "50%", bottom: 0, right: 0,
        background: "radial-gradient(ellipse at 80% 35%, rgba(0,140,255,0.26) 0%, rgba(0,60,200,0.12) 45%, transparent 70%)",
        filter: "blur(28px)",
        animation: "gfxPulse 5.2s ease-in-out 1.2s infinite",
      }} />
      {/* Tiger — lightning bolt sparks */}
      {[...Array(5)].map((_, i) => (
        <div key={`spark-${i}`} style={{
          position: "absolute",
          right: `${4 + i * 6}%`,
          top: `${12 + (i % 3) * 20}%`,
          width: 1.5,
          height: 28 + i * 9,
          background: "linear-gradient(180deg, rgba(0,210,255,0.95) 0%, rgba(80,150,255,0.5) 65%, transparent 100%)",
          filter: "blur(1px)",
          boxShadow: "0 0 8px rgba(0,200,255,0.65)",
          animation: `dtLightningZap ${1.7 + i * 0.65}s ease-in-out ${i * 0.55}s infinite`,
          transform: `rotate(${-6 + i * 5}deg)`,
        }} />
      ))}
      {/* Tiger — bottom electric glow line */}
      <div style={{
        position: "absolute", bottom: 0, right: 0, width: "50%", height: 3,
        background: "linear-gradient(90deg, transparent, rgba(0,153,255,0.65), rgba(100,210,255,0.85), transparent)",
        filter: "blur(3px)",
      }} />
      {/* Tiger — large electric radial */}
      <div style={{
        position: "absolute", top: "25%", right: "8%",
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,120,255,0.18) 0%, transparent 70%)",
        filter: "blur(45px)",
        animation: "gfxPulse 4.8s ease-in-out 2.2s infinite",
      }} />

      {/* Centre divider glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 3, height: "100%",
        background: "linear-gradient(180deg, transparent 0%, rgba(255,210,63,0.55) 20%, rgba(255,210,63,0.85) 50%, rgba(255,210,63,0.55) 80%, transparent 100%)",
        filter: "blur(5px)",
        animation: "gfxFlicker 3.5s ease-in-out infinite",
      }} />
      {/* Hex-grid floor */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "38%",
        backgroundImage: `
          linear-gradient(to right, rgba(255,210,63,0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,210,63,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "36px 28px",
        transform: "perspective(260px) rotateX(52deg)",
        transformOrigin: "bottom center",
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
      }} />
    </div>
  );
}

/* ─── Card3DFlip — enhanced card with animated 3D flip reveal ── */
export interface DTCardInfo { rank: string; suit: "♠" | "♥" | "♦" | "♣" }
const DT_SUIT_COLORS: Record<string, string> = {
  "♠": "#1e3a5f", "♣": "#1e3a5f", "♥": "#dc2626", "♦": "#dc2626",
};

export function Card3DFlip({ card, faceDown = false, lifted = false, winner = false, loser = false, delay = 0 }: {
  card?: DTCardInfo; faceDown?: boolean; lifted?: boolean; winner?: boolean; loser?: boolean; delay?: number;
}) {
  const suitColor = card ? DT_SUIT_COLORS[card.suit] : "#1e3a5f";
  const isRed = card ? (card.suit === "♥" || card.suit === "♦") : false;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0, rotateZ: -10, scale: 0.85 }}
      animate={{ y: lifted ? -14 : 0, opacity: 1, rotateZ: 0, scale: lifted ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 270, damping: 22, delay }}
      style={{
        width: 82, height: 114,
        borderRadius: 10, position: "relative", flexShrink: 0, cursor: "default",
        perspective: 600, transformStyle: "preserve-3d",
        animation: winner ? "dtWinCardFloat 2s ease-in-out infinite" : "none",
      }}
    >
      <motion.div
        initial={faceDown ? undefined : { rotateY: 90 }}
        animate={{ rotateY: 0 }}
        transition={{ type: "spring", stiffness: 190, damping: 19, delay: delay + 0.18 }}
        style={{
          width: "100%", height: "100%", borderRadius: 10,
          background: faceDown
            ? "linear-gradient(135deg, #1e3a5f 0%, #0f2340 50%, #1e3a5f 100%)"
            : "linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)",
          border: faceDown
            ? "2px solid rgba(47,69,83,0.8)"
            : winner
            ? "2px solid rgba(255,210,63,0.85)"
            : loser
            ? "2px solid rgba(255,80,0,0.45)"
            : "2px solid #e2e8f0",
          boxShadow: winner
            ? "0 18px 45px rgba(0,0,0,0.65), 0 0 32px rgba(255,210,63,0.7), 0 0 65px rgba(255,210,63,0.3)"
            : loser
            ? "0 8px 20px rgba(0,0,0,0.5), 0 0 14px rgba(255,80,0,0.2)"
            : "0 6px 20px rgba(0,0,0,0.5)",
          position: "relative", overflow: "hidden",
          transformStyle: "preserve-3d",
          transition: "box-shadow 0.6s ease, border-color 0.6s ease",
        }}
      >
        {faceDown ? (
          <>
            <div style={{
              position: "absolute", inset: 5, borderRadius: 7,
              background: "repeating-linear-gradient(45deg, #1a3a5f, #1a3a5f 4px, #0f2340 4px, #0f2340 8px)",
            }} />
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, opacity: 0.45,
            }}>🎴</div>
          </>
        ) : card && (
          <>
            <div style={{ position: "absolute", top: 6, left: 7, fontSize: 14, fontWeight: 900, color: suitColor, lineHeight: 1.15 }}>
              <div>{card.rank}</div>
              <div style={{ fontSize: 11 }}>{card.suit}</div>
            </div>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              fontSize: 34, color: suitColor,
              filter: isRed ? "drop-shadow(0 0 4px rgba(220,38,38,0.45))" : "drop-shadow(0 0 3px rgba(30,58,95,0.45))",
            }}>{card.suit}</div>
            <div style={{
              position: "absolute", bottom: 6, right: 7, fontSize: 14, fontWeight: 900,
              color: suitColor, lineHeight: 1.15, transform: "rotate(180deg)",
            }}>
              <div>{card.rank}</div>
              <div style={{ fontSize: 11 }}>{card.suit}</div>
            </div>
            {/* Specular highlight */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 46,
              borderRadius: "10px 10px 0 0",
              background: "linear-gradient(180deg, rgba(255,255,255,0.48), transparent)",
              pointerEvents: "none",
            }} />
            {/* Winner gold shimmer */}
            {winner && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255,210,63,0.28) 0%, transparent 50%, rgba(255,210,63,0.18) 100%)",
                animation: "dtGoldShimmer 2s linear infinite",
                backgroundSize: "200% 200%",
                pointerEvents: "none",
              }} />
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Card Compare Bar ───────────────────────────────────────── */
const CARD_RANKS_ORDER = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

export function CardCompareBar({ dragonCard, tigerCard, winner }: {
  dragonCard: DTCardInfo | null; tigerCard: DTCardInfo | null; winner: "dragon" | "tiger" | "tie" | null;
}) {
  if (!dragonCard || !tigerCard || !winner) return null;
  const dIdx = CARD_RANKS_ORDER.indexOf(dragonCard.rank);
  const tIdx = CARD_RANKS_ORDER.indexOf(tigerCard.rank);
  const total = CARD_RANKS_ORDER.length - 1;
  const dPct = Math.max(5, (dIdx / total) * 100);
  const tPct = Math.max(5, (tIdx / total) * 100);
  const dragonIsRed = dragonCard.suit === "♥" || dragonCard.suit === "♦";
  const tigerIsRed = tigerCard.suit === "♥" || tigerCard.suit === "♦";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.35 }}
        style={{
          padding: "10px 18px",
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(255,210,63,0.14)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Dragon label */}
          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 50 }}>
            <div style={{
              fontSize: 19, fontWeight: 900,
              color: dragonIsRed ? "#f87171" : "#94a3b8",
              textShadow: dragonIsRed ? "0 0 8px rgba(248,113,113,0.5)" : "none",
            }}>{dragonCard.rank}{dragonCard.suit}</div>
            <div style={{ fontSize: 9, color: "#ff4400", fontWeight: 800, letterSpacing: 1.2 }}>DRAGON</div>
          </div>

          {/* Bar track */}
          <div style={{ flex: 1, position: "relative", height: 9, borderRadius: 5, background: "rgba(47,69,83,0.65)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${dPct}%` }}
              transition={{ duration: 0.85, delay: 0.55, ease: "easeOut" }}
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                background: "linear-gradient(90deg, #ff2200, #ff6600)",
                borderRadius: 5,
                boxShadow: winner === "dragon" ? "0 0 14px rgba(255,80,0,0.85)" : "none",
              }}
            />
            <motion.div initial={{ width: 0 }} animate={{ width: `${tPct}%` }}
              transition={{ duration: 0.85, delay: 0.65, ease: "easeOut" }}
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                background: "linear-gradient(270deg, #0099ff, #00d4ff)",
                borderRadius: 5,
                boxShadow: winner === "tiger" ? "0 0 14px rgba(0,153,255,0.85)" : "none",
              }}
            />
            {winner === "tie" && (
              <div style={{
                position: "absolute", left: "50%", transform: "translateX(-50%)",
                top: -4, width: 17, height: 17, borderRadius: "50%",
                background: "#a855f7",
                boxShadow: "0 0 18px rgba(168,85,247,0.9)",
                animation: "gfxPulse 0.9s ease-in-out infinite",
              }} />
            )}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14, delay: 1.3 }}
              style={{
                position: "absolute",
                left: winner === "dragon" ? `${dPct}%` : winner === "tiger" ? `calc(100% - ${tPct}%)` : "50%",
                transform: "translate(-50%, -50%)", top: "50%",
                width: 16, height: 16, borderRadius: "50%",
                background: "#ffd23f",
                boxShadow: "0 0 16px rgba(255,210,63,0.95)",
              }}
            />
          </div>

          {/* Tiger label */}
          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 50 }}>
            <div style={{
              fontSize: 19, fontWeight: 900,
              color: tigerIsRed ? "#f87171" : "#94a3b8",
              textShadow: tigerIsRed ? "0 0 8px rgba(248,113,113,0.5)" : "none",
            }}>{tigerCard.rank}{tigerCard.suit}</div>
            <div style={{ fontSize: 9, color: "#0099ff", fontWeight: 800, letterSpacing: 1.2 }}>TIGER</div>
          </div>
        </div>
        {/* Result label */}
        <div style={{ textAlign: "center", marginTop: 5 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
            color: winner === "tie" ? "#a855f7" : "#ffd23f",
            textShadow: winner === "tie" ? "0 0 10px rgba(168,85,247,0.7)" : "0 0 10px rgba(255,210,63,0.7)",
          }}>
            {winner === "tie" ? "⚖️ TIE — EQUAL CARDS" : winner === "dragon" ? "🐉 DRAGON WINS!" : "🐅 TIGER WINS!"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Dragon Tiger Slow Win Reveal ───────────────────────────── */
export function DragonTigerSlowWin({ active, winner, profit, asset }: {
  active: boolean; winner: "dragon" | "tiger" | "tie" | null; profit?: number; asset?: string;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 120);
    const t2 = setTimeout(() => setStep(2), 500);
    const t3 = setTimeout(() => setStep(3), 820);
    const t4 = setTimeout(() => setStep(4), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  const winColor = winner === "dragon" ? "#ff6600" : winner === "tiger" ? "#0099ff" : "#a855f7";

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div key="dt-slow-win"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Gold vignette */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,210,63,0.3) 0%, transparent 72%)",
            animation: "dtSlowWinVignette 2.6s ease-out forwards",
          }} />
          {/* Winner-side colour wash */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: `radial-gradient(ellipse at ${winner === "dragon" ? "22%" : winner === "tiger" ? "78%" : "50%"} 50%, ${winColor}22 0%, transparent 58%)`,
            animation: "gfxPulse 1.3s ease-in-out 2",
          }} />
          {/* Light rays */}
          {step >= 2 && [0,1,2,3,4,5].map(i => (
            <div key={`ray-${i}`} style={{
              position: "absolute", bottom: 0, left: "50%",
              width: 3, height: "58%",
              background: `linear-gradient(0deg, ${winColor}88 0%, transparent 100%)`,
              transformOrigin: "bottom center",
              transform: `rotate(${(i - 2.5) * 22}deg)`,
              opacity: 0,
              animation: `plinkoLightRay 1.2s ease-out ${0.04 + i * 0.07}s forwards`,
              ["--ray-angle" as string]: `${(i - 2.5) * 22}deg`,
            }} />
          ))}
          {/* YOU WIN banner */}
          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 22 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 440, damping: 20 }}
              style={{ textAlign: "center", marginBottom: 10 }}
            >
              <div style={{
                fontSize: 44, fontWeight: 900, letterSpacing: 3,
                fontFamily: "var(--font-orbitron), monospace",
                background: "linear-gradient(90deg, #FFD700, #ff8c00, #FFD700)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 26px rgba(255,210,0,0.9))",
                animation: "dtGoldShimmer 1.5s linear infinite",
              }}>🏆 YOU WIN!</div>
              <div style={{
                fontSize: 16, fontWeight: 800, marginTop: 6, color: winColor,
                textShadow: `0 0 16px ${winColor}`,
                letterSpacing: 1.5,
              }}>
                {winner === "dragon" ? "🐉 DRAGON" : winner === "tiger" ? "🐅 TIGER" : "⚖️ TIE"} WINS
              </div>
            </motion.div>
          )}
          {/* Profit amount */}
          {step >= 4 && profit !== undefined && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.45 }}
              style={{ fontSize: 22, fontWeight: 800, color: "#00c2ff", textShadow: "0 0 18px rgba(0,194,255,0.85)", letterSpacing: 1 }}
            >+{profit.toFixed(6)} {asset}</motion.div>
          )}
          {/* Confetti rain */}
          {step >= 2 && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {["#ff2200","#ff6600","#ffd23f","#0099ff","#00d4ff","#ff5cb1","#a855f7","#ffffff"].map((color, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: `${8 + i * 11}%`,
                  width: 7, height: 11, borderRadius: 2, background: color,
                  animation: `gfxConfetti${i % 8} ${1.4 + i * 0.1}s ease-in ${i * 0.07}s forwards`,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Dragon Tiger Slow Lose Reveal ──────────────────────────── */
export function DragonTigerSlowLose({ active, winner }: {
  active: boolean; winner: "dragon" | "tiger" | "tie" | null;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 130);
    const t2 = setTimeout(() => setStep(2), 520);
    const t3 = setTimeout(() => setStep(3), 920);
    const t4 = setTimeout(() => setStep(4), 1350);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div key="dt-slow-lose"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none",
          }}
        >
          {/* Red vignette */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "radial-gradient(ellipse at 50% 50%, rgba(220,0,0,0.34) 0%, transparent 72%)",
            animation: "dtSlowLoseVignette 2.2s ease-out forwards",
          }} />
          {/* Pulse rings */}
          {step >= 3 && [0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", width: 160, height: 160, borderRadius: "50%",
              border: `2px solid rgba(255,32,32,${0.68 - i * 0.18})`,
              animation: `gfxPulseRing 1.6s ease-out ${i * 0.34}s forwards`, opacity: 0,
            }} />
          ))}
          {/* YOU LOSE text */}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: -44, scale: 0.72 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 310, damping: 16 }} style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 46, fontWeight: 900, color: "#ff2020", letterSpacing: 3,
                fontFamily: "var(--font-orbitron), monospace",
                textShadow: "0 0 26px rgba(255,32,32,0.95), 0 0 55px rgba(255,32,32,0.5), 0 6px 0 #6a0000",
                animation: "minesLoseGlitch 0.65s ease-out",
              }}>💀 YOU LOSE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#b1bad3", marginTop: 7, letterSpacing: 1 }}>
                {winner === "dragon" ? "🐉 Dragon" : winner === "tiger" ? "🐅 Tiger" : "Tie"} took this round
              </div>
            </motion.div>
          )}
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ fontSize: 12, color: "#b1bad3", fontStyle: "italic", marginTop: 12 }}
            >Better luck next round...</motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Dragon Tiger Tie Burst ─────────────────────────────────── */
export function DragonTigerTieBurst({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 110);
    const t2 = setTimeout(() => setStep(2), 430);
    const t3 = setTimeout(() => setStep(3), 730);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  if (!active || step < 1) return null;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 25 }}>
      {/* Aurora blob */}
      <div style={{
        position: "absolute", width: 290, height: 290, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(168,85,247,0.52) 0%, rgba(255,210,63,0.22) 50%, transparent 72%)",
        filter: "blur(32px)",
        animation: "dtTieAurora 2.2s ease-in-out infinite",
      }} />
      {/* Shockwave rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          border: `3px solid ${i === 0 ? "rgba(168,85,247,0.85)" : i === 1 ? "rgba(255,210,63,0.65)" : "rgba(0,194,255,0.55)"}`,
          animation: `dtTieShockRing 1.5s ease-out ${i * 0.3}s forwards`,
          opacity: 0, width: 0, height: 0,
        }} />
      ))}
      {/* Golden sparkle particles */}
      {step >= 2 && Array.from({ length: 14 }).map((_, i) => (
        <div key={`tie-spark-${i}`} style={{
          position: "absolute",
          width: i % 2 === 0 ? 9 : 5, height: i % 2 === 0 ? 9 : 5,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#ffd23f" : i % 3 === 1 ? "#a855f7" : "#00c2ff",
          boxShadow: `0 0 10px ${i % 3 === 0 ? "#ffd23f" : "#a855f7"}`,
          animation: `gfxParticle${i % 20} 1.2s ease-out ${i * 0.05}s forwards`,
        }} />
      ))}
      {/* TIE banner */}
      {step >= 3 && (
        <motion.div initial={{ scale: 0.35, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 510, damping: 18 }}
          style={{
            fontSize: 40, fontWeight: 900, letterSpacing: 3,
            fontFamily: "var(--font-orbitron), monospace",
            background: "linear-gradient(90deg, #a855f7, #ffd23f, #a855f7)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(168,85,247,0.9))",
            animation: "dtGoldShimmer 1.5s linear infinite",
            position: "relative",
          }}
        >⚖️ TIE!</motion.div>
      )}
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════
   VIDEO POKER EFFECTS — Cinematic slow reveals
═══════════════════════════════════════════════════════════════ */

function pokerTier(rank) {
  const r = rank.toLowerCase();
  if (r.includes('royal') || r.includes('straight flush')) return 3;
  if (r.includes('four') || r.includes('full') || r.includes('flush') || r.includes('straight')) return 2;
  if (r.includes('two') || r.includes('three')) return 1;
  return 0;
}

export function PokerSlowWinReveal({
  active, handRank, multiplier, profit, asset,
}) {
  const [step, setStep] = useState(0);
  const [countVal, setCountVal] = useState(0);
  const tier = pokerTier(handRank);

  const allTimings = [
    [0, 200, 550, 1100, 1700, 2100],
    [0, 180, 500, 950, 1600, 2200, 3000],
    [0, 160, 450, 880, 1500, 2200, 3000, 3800],
    [0, 140, 400, 820, 1400, 2200, 3200, 4200, 5000],
  ];
  const timings = allTimings[tier];

  useEffect(() => {
    if (!active) { setStep(0); setCountVal(0); return; }
    const timers = timings.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [active, tier]);

  useEffect(() => {
    if (step < 5 || !active) return;
    const dur = 900;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t2 = Math.min(1, (now - start) / dur);
      setCountVal((1 - Math.pow(1 - t2, 3)) * profit);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, active, profit]);

  const isRoyal = tier === 3;
  const isBig   = tier >= 2;
  const totalSteps = timings.length;
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  const rankColor = isRoyal
    ? 'linear-gradient(90deg,#ffd23f,#a855f7,#00c2ff,#ffd23f)'
    : isBig ? 'linear-gradient(90deg,#ffd23f,#f59e0b,#ffd23f)'
    : 'linear-gradient(90deg,#ffd23f,#ffffff,#ffd23f)';

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div key="poker-win-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9 } }}
          style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, pointerEvents: 'none' }}
        >
          <div style={{ position: 'absolute', inset: 0,
            background: isRoyal ? 'rgba(220,180,255,0.82)' : 'rgba(255,230,120,0.78)',
            animation: 'pokerWinFlash 0.5s ease-out forwards' }} />

          {step >= 2 && (
            <>
              <div style={{ position: 'absolute', inset: 0,
                background: isRoyal
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.35) 0%, rgba(255,210,63,0.15) 50%, transparent 75%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(255,210,63,0.38) 0%, rgba(255,180,30,0.12) 50%, transparent 75%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {rays.map((angle, ri) => (
                  <div key={angle} style={{
                    position: 'absolute', width: 3, height: '65%',
                    background: isRoyal
                      ? 'linear-gradient(180deg,rgba(168,85,247,0.9) 0%,rgba(255,210,63,0.5) 55%,transparent 100%)'
                      : 'linear-gradient(180deg,rgba(255,210,63,0.95) 0%,rgba(255,180,30,0.5) 55%,transparent 100%)',
                    transformOrigin: '50% 100%',
                    transform: 'rotate(' + angle + 'deg)',
                    animation: 'plinkoLightRay 1.8s ease-out ' + (ri * 0.05) + 's forwards',
                    filter: 'blur(2px)', opacity: 0,
                  }} />
                ))}
              </div>
            </>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.3, y: -35, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 230, damping: 15 }}
              style={{ textAlign: 'center', zIndex: 10, marginBottom: 6 }}
            >
              <div style={{
                fontSize: isRoyal ? 32 : isBig ? 28 : 22,
                fontWeight: 900, fontFamily: 'monospace', letterSpacing: 3,
                background: rankColor, backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 18px rgba(255,210,63,0.9))',
                animation: isRoyal ? 'pokerRoyalShimmer 2s linear infinite' : 'none',
              }}>{handRank.toUpperCase()}</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 210, damping: 13 }}
              style={{ textAlign: 'center', zIndex: 10, marginBottom: 4 }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', marginBottom: 3 }}>MULTIPLIER</div>
              <div style={{
                fontSize: isRoyal ? 96 : isBig ? 80 : 64,
                fontWeight: 900, fontFamily: 'monospace',
                background: rankColor, backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 ' + (isRoyal ? 32 : isBig ? 22 : 14) + 'px rgba(255,210,63,0.95))',
                animation: isRoyal ? 'pokerRoyalShimmer 2.5s linear infinite' : 'none',
              }}>{multiplier.toFixed(0)}x</div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ fontSize: 19, fontWeight: 800, fontFamily: 'monospace', color: '#ffd23f',
                textShadow: '0 0 14px rgba(255,210,63,0.9)', marginBottom: 8 }}
            >
              +{step >= 6 ? profit.toFixed(4) : countVal.toFixed(4)} {asset}
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                fontSize: isRoyal ? 58 : 46, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace',
                background: rankColor, backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(255,210,63,0.95)) drop-shadow(0 0 48px rgba(255,210,63,0.4))',
                animation: isRoyal ? 'pokerRoyalShimmer 2.2s linear infinite' : step >= totalSteps ? 'minesGemShimmer 2.2s linear infinite' : 'none',
              }}>YOU WIN!</div>
            </motion.div>
          )}

          {step >= 7 && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              {['#ffd23f','#a855f7','#00c2ff','#f472b6','#ffffff','#4ade80','#fbbf24','#f87171'].map((c, i) => (
                <div key={i} style={{
                  position: 'absolute', top: 0, left: (5 + i * 12.5) + '%',
                  width: i % 3 === 0 ? 12 : 8, height: i % 3 === 0 ? 16 : 10,
                  borderRadius: i % 2 === 0 ? '50%' : '2px', background: c,
                  animation: 'gfxConfetti' + (i % 8) + ' ' + (1.3 + i * 0.14) + 's ease-in ' + (i * 0.06) + 's forwards',
                  boxShadow: '0 0 6px ' + c,
                }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PokerSlowLoseReveal({ active }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 360),
      setTimeout(() => setStep(3), 960),
      setTimeout(() => setStep(4), 1750),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && step >= 1 && (
        <motion.div key="poker-lose-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, pointerEvents: 'none' }}
        >
          <div style={{ position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.42) 0%, rgba(120,0,0,0.2) 45%, transparent 70%)' }} />

          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              style={{ fontSize: 16, color: 'rgba(180,140,140,0.85)', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 10 }}
            >NO WINNING HAND</motion.div>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ scale: 0.4, y: -40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
            >
              <div style={{
                fontSize: 56, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace', color: '#ef4444',
                textShadow: '0 0 26px rgba(239,68,68,0.95), 0 0 52px rgba(239,68,68,0.45), 0 7px 0 #7a0000',
              }}>YOU LOSE</div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
              style={{ fontSize: 13, color: '#b1bad3', fontStyle: 'italic', marginTop: 12 }}
            >Better luck next hand...</motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
