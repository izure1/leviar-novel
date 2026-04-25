"use strict";
(() => {
  // src/define/defineCmdUI.ts
  function resolveVal(val, vars) {
    if (typeof val === "function") return val(vars);
    if (Array.isArray(val)) {
      return val.map(
        (item) => item && typeof item === "object" && !Array.isArray(item) ? resolveObj(item, vars) : resolveVal(item, vars)
      );
    }
    return val;
  }
  function resolveObj(obj, vars) {
    const result = {};
    for (const key in obj) {
      result[key] = resolveVal(obj[key], vars);
    }
    return result;
  }
  function resolveParams(params, ctx) {
    return resolveObj(params, ctx.scene.getVars());
  }
  function define2(schema) {
    let _onUpdate = null;
    let _version = 0;
    let _moduleKey = null;
    const _raw = { ...schema ?? {} };
    const data = new Proxy(_raw, {
      set(target, key, value) {
        ;
        target[key] = value;
        const v = ++_version;
        Promise.resolve().then(() => {
          if (_version === v) {
            _onUpdate?.(data);
          }
        });
        return true;
      }
    });
    let _handlerFn = null;
    let _viewBuilderFn = null;
    const module = {
      __isModule: true,
      __schemaDefault: schema ?? {},
      get __handler() {
        return _handlerFn;
      },
      get __viewBuilder() {
        return _viewBuilderFn;
      },
      __setKey(key) {
        _moduleKey = key;
      },
      defineCommand(handler) {
        _handlerFn = (rawParams, ctx) => {
          const resolved = resolveParams(rawParams, ctx);
          const result = handler(resolved, ctx, data);
          if (_moduleKey) {
            ctx.cmdState.set(_moduleKey, { ..._raw });
          }
          return result;
        };
        return module;
      },
      defineView(builder) {
        _viewBuilderFn = (mergedData, ctx) => {
          for (const key in mergedData) {
            if (mergedData[key] !== void 0) {
              ;
              data[key] = mergedData[key];
            }
          }
          const entry = builder(data, ctx);
          _onUpdate = (d) => entry.update?.(d);
          ++_version;
          return entry;
        };
        return module;
      }
    };
    return module;
  }

  // src/modules/dialogue.ts
  var DEFAULT_BG = {
    color: "rgba(0,0,0,0.82)"
  };
  var DEFAULT_SPEAKER = {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffe066",
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: "left"
  };
  var DEFAULT_TEXT = {
    fontSize: 20,
    color: "#ffffff",
    lineHeight: 1.6,
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: "left",
    textShadowBlur: 1,
    textShadowColor: "#000000",
    textShadowOffsetX: 1,
    textShadowOffsetY: 1
  };
  function resolveSpeaker(speakerKey, charDefs) {
    if (!speakerKey) return void 0;
    return charDefs?.[speakerKey]?.name ?? speakerKey;
  }
  var dialogueModule = define2({
    bg: void 0,
    speaker: void 0,
    text: void 0,
    subIndex: 0,
    lines: [],
    speakerKey: void 0,
    speed: void 0
  });
  dialogueModule.defineView((data, ctx) => {
    const cam = ctx.world.camera;
    const w = ctx.renderer.width;
    const h = ctx.renderer.height;
    const toLocal = (cx, cy) => cam && typeof cam.canvasToLocal === "function" ? cam.canvasToLocal(cx, cy) : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 };
    const bgCfg = { ...DEFAULT_BG, ...data.bg ?? {} };
    const spkCfg = { ...DEFAULT_SPEAKER, ...data.speaker ?? {} };
    const txtCfg = { ...DEFAULT_TEXT, ...data.text ?? {} };
    const BOX_H = typeof bgCfg.height === "number" ? bgCfg.height : h * 0.28;
    const BOX_CY = h - BOX_H / 2;
    const bgObj = ctx.world.createRectangle({
      style: {
        ...bgCfg,
        width: bgCfg.width ?? w,
        height: BOX_H,
        zIndex: bgCfg.zIndex ?? 300,
        opacity: 1,
        display: "none",
        pointerEvents: false
      },
      transform: { position: toLocal(w / 2, BOX_CY) }
    });
    ctx.world.camera?.addChild(bgObj);
    ctx.renderer.track(bgObj);
    const spkY = h - BOX_H + 24;
    const speakerObj = ctx.world.createText({
      attribute: { text: "" },
      style: {
        ...spkCfg,
        width: w * 0.9,
        zIndex: spkCfg.zIndex ?? 301,
        opacity: 1,
        display: "none",
        pointerEvents: false
      },
      transform: { position: toLocal(w / 2, spkY) }
    });
    ctx.world.camera?.addChild(speakerObj);
    ctx.renderer.track(speakerObj);
    const spkH = (spkCfg.fontSize ?? 18) * 1.5;
    const textObj = ctx.world.createText({
      attribute: { text: "" },
      style: {
        ...txtCfg,
        width: txtCfg.width ?? w * 0.9,
        zIndex: txtCfg.zIndex ?? 301,
        opacity: 1,
        display: "none",
        pointerEvents: false
      },
      transform: { position: toLocal(w / 2, spkY + spkH + 8) }
    });
    ctx.world.camera?.addChild(textObj);
    ctx.renderer.track(textObj);
    const charDefs = ctx.renderer.config.characters;
    let _isTyping = false;
    let _fullText = "";
    let _activeTx = null;
    let _prevLines = null;
    const _renderText = (speaker, text, speed, immediate = false) => {
      bgObj.fadeIn(200, "easeOut");
      speakerObj.attribute.text = speaker ?? "";
      speakerObj.fadeIn(200, "easeOut");
      if (immediate || speed === 0) {
        _isTyping = false;
        _fullText = text;
        _activeTx?.stop?.();
        _activeTx = null;
        textObj.attribute.text = text;
        textObj.fadeIn(200, "easeOut");
      } else {
        const spd = speed ?? 30;
        _isTyping = true;
        _fullText = text;
        if (_activeTx) {
          _activeTx.stop?.();
          _activeTx = null;
        }
        const anim = textObj.transition(text, spd);
        _activeTx = anim;
        textObj.fadeIn(200, "easeOut");
        if (anim && typeof anim.on === "function") {
          anim.on("end", () => {
            _isTyping = false;
            _activeTx = null;
          });
        }
      }
    };
    if (data.lines?.length) {
      _prevLines = data.lines;
      const txt = data.lines[data.subIndex ?? 0];
      const spkName = resolveSpeaker(data.speakerKey, charDefs);
      _renderText(spkName, txt, void 0, true);
    }
    return {
      show: (dur = 250) => {
        bgObj.fadeIn(dur, "easeOut");
      },
      hide: (dur = 300) => {
        bgObj.fadeOut(dur, "easeIn");
        speakerObj.fadeOut(dur, "easeIn");
        textObj.fadeOut(dur, "easeIn");
      },
      isTyping: () => _isTyping,
      completeTyping: () => {
        if (!_isTyping) return;
        _isTyping = false;
        _activeTx?.stop?.();
        _activeTx = null;
        textObj.attribute.text = _fullText;
        textObj.style.opacity = 1;
      },
      /**
       * data가 변경될 때 Proxy가 자동으로 호출합니다.
       * - lines가 바뀐 경우: 텍스트 재렌더
       * - bg/speaker/text 스타일이 바뀐 경우: 캔버스 오브젝트 스타일 갱신
       */
      update: (d) => {
        const newBgCfg = { ...DEFAULT_BG, ...d.bg ?? {} };
        const newSpkCfg = { ...DEFAULT_SPEAKER, ...d.speaker ?? {} };
        const newTxtCfg = { ...DEFAULT_TEXT, ...d.text ?? {} };
        Object.assign(bgObj.style, newBgCfg);
        Object.assign(speakerObj.style, newSpkCfg);
        Object.assign(textObj.style, newTxtCfg);
        if (d.lines && d.lines !== _prevLines && d.lines.length > 0) {
          _prevLines = d.lines;
          const txt = d.lines[d.subIndex ?? 0];
          const spkName = resolveSpeaker(d.speakerKey, charDefs);
          _renderText(spkName, txt, d.speed);
        }
      }
    };
  });
  dialogueModule.defineCommand((cmd, ctx, data) => {
    const textArray = Array.isArray(cmd.text) ? cmd.text : [cmd.text];
    const lines = textArray.map((t) => ctx.scene.interpolateText(t));
    const index = ctx.scene.getTextSubIndex();
    const ui = ctx.ui.get("dialogue");
    if (ui && typeof ui.isTyping === "function" && ui.isTyping()) {
      ui.completeTyping();
      return false;
    }
    if (index >= lines.length) {
      return true;
    }
    data.speed = cmd.speed;
    data.speakerKey = cmd.speaker;
    data.subIndex = index;
    data.lines = [...lines];
    ctx.scene.setTextSubIndex(index + 1);
    return false;
  });
  var dialogue_default = dialogueModule;

  // src/modules/choice.ts
  var DEFAULT_CHOICE = {
    fontSize: 18,
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    color: "#fff",
    background: "rgba(30,30,60,0.85)",
    borderColor: "rgba(255,255,255,0.3)",
    hoverBackground: "rgba(80,80,180,0.9)",
    hoverBorderColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    minWidth: 260
  };
  var choiceModule = define2({
    fontSize: void 0,
    fontFamily: void 0,
    color: void 0,
    background: void 0,
    borderColor: void 0,
    hoverBackground: void 0,
    hoverBorderColor: void 0,
    borderRadius: void 0,
    minWidth: void 0
  });
  choiceModule.defineView((data, ctx) => {
    const cfg = { ...DEFAULT_CHOICE, ...data };
    const cam = ctx.world.camera;
    const w = ctx.renderer.width;
    const h = ctx.renderer.height;
    const toLocal = (cx, cy) => cam && typeof cam.canvasToLocal === "function" ? cam.canvasToLocal(cx, cy) : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 };
    const bgObj = ctx.world.createRectangle({
      style: {
        color: "rgba(0,0,0,0.6)",
        width: w,
        height: h,
        zIndex: 500,
        opacity: 0,
        pointerEvents: true
      },
      transform: { position: toLocal(w / 2, h / 2) }
    });
    ctx.world.camera?.addChild(bgObj);
    ctx.renderer.track(bgObj);
    let _btnObjs = [];
    const _clearButtons = () => {
      _btnObjs.forEach((obj) => {
        obj.remove({ child: true });
      });
      _btnObjs = [];
    };
    return {
      show: () => {
        bgObj.fadeIn(200, "easeOut");
      },
      hide: () => {
        bgObj.fadeOut(200, "easeIn");
        _clearButtons();
      },
      onChoices: (choices, onSelect) => {
        bgObj.fadeIn(200, "easeOut");
        _clearButtons();
        const fSize = cfg.fontSize ?? DEFAULT_CHOICE.fontSize;
        const mWidth = cfg.minWidth ?? DEFAULT_CHOICE.minWidth;
        const gap = 12;
        const paddingY = 12;
        const btnH = fSize * 1.5 + paddingY * 2;
        const totalHeight = choices.length * btnH + Math.max(0, choices.length - 1) * gap;
        const startY = h / 2 - totalHeight / 2 + btnH / 2;
        choices.forEach((choice, i) => {
          const cy = startY + i * (btnH + gap);
          const textStr = String(choice.text);
          const estimatedTextW = textStr.length * fSize * 0.8;
          const btnW = Math.max(mWidth, estimatedTextW + 64);
          const btnObj = ctx.world.createRectangle({
            style: {
              color: cfg.background ?? DEFAULT_CHOICE.background,
              borderColor: cfg.borderColor ?? DEFAULT_CHOICE.borderColor,
              borderWidth: 1.5,
              borderRadius: cfg.borderRadius ?? DEFAULT_CHOICE.borderRadius,
              width: btnW,
              height: btnH,
              zIndex: 501,
              pointerEvents: true,
              opacity: 1
            },
            transform: { position: toLocal(w / 2, cy) }
          });
          const txtObj = ctx.world.createText({
            attribute: { text: textStr },
            style: {
              fontSize: fSize,
              fontFamily: cfg.fontFamily ?? DEFAULT_CHOICE.fontFamily,
              color: cfg.color ?? DEFAULT_CHOICE.color,
              textAlign: "center",
              zIndex: 502,
              pointerEvents: false
            },
            transform: { position: { x: 0, y: 0, z: 0 } }
          });
          btnObj.on("mouseover", () => {
            btnObj.animate({ style: { color: cfg.hoverBackground, borderColor: cfg.hoverBorderColor } }, 150);
          });
          btnObj.on("mouseout", () => {
            btnObj.animate({ style: { color: cfg.background, borderColor: cfg.borderColor } }, 150);
          });
          btnObj.on("click", () => {
            onSelect(i);
          });
          btnObj.addChild(txtObj);
          ctx.world.camera?.addChild(btnObj);
          ctx.renderer.track(btnObj);
          ctx.renderer.track(txtObj);
          _btnObjs.push(btnObj);
        });
      },
      update: (d) => {
        Object.assign(cfg, DEFAULT_CHOICE, d);
      }
    };
  });
  choiceModule.defineCommand((cmd, ctx) => {
    const entry = ctx.ui.get("choice");
    if (!entry) {
      console.warn("[leviar-novel] choices UI entry not found in registry. Ensure it is defined in novel.config.ts modules.");
    }
    ctx.ui.get("dialogue")?.hide?.();
    const resolvedChoices = cmd.choices.map((c) => {
      const textStr = typeof c.text === "function" ? c.text(ctx.scene.getVars()) : c.text;
      return { ...c, text: ctx.scene.interpolateText(textStr) };
    });
    console.log("[leviar-novel] choiceHandler: opening choices", resolvedChoices);
    entry?.onChoices?.(resolvedChoices, (i) => {
      const selected = cmd.choices[i];
      if (!selected) return;
      if (selected.var) {
        for (const [key, value] of Object.entries(selected.var)) {
          ctx.scene.setGlobalVar(key, value);
        }
      }
      entry.hide?.();
      if (selected.next) {
        ctx.scene.loadScene(selected.next);
      } else if (selected.goto) {
        ctx.scene.jumpToLabel(selected.goto);
      } else {
        ctx.scene.end();
      }
    });
    return "handled";
  });
  var choice_default = choiceModule;

  // src/constants/render.ts
  var Z_INDEX = {
    BACKGROUND: -1,
    CHARACTER_NORMAL: 10,
    CHARACTER_HIGHLIGHT: 100,
    MOOD: 100,
    LIGHT: 200,
    UI_BASE: 300,
    OVERLAY_WHISPER: 400,
    OVERLAY_CAPTION: 410,
    OVERLAY_TITLE: 420,
    CHARACTER_CUTIN: 500,
    TRANSITION: 999
  };

  // src/modules/background.ts
  var backgroundModule = define2({
    key: void 0,
    fit: "cover",
    duration: 1e3,
    parallax: true,
    isVideo: false
  });
  backgroundModule.defineView((data, ctx) => {
    let _bgObj = null;
    let _bgParallax = null;
    const _createBg = (key, fit, parallax, isVideo, opacity = 1) => {
      const bgDefs = ctx.renderer.config.backgrounds;
      const def = bgDefs[key];
      if (!def) return null;
      const src = def.src ?? key;
      const cam = ctx.renderer.world.camera;
      const zPos = ctx.renderer.depth;
      const baseW = ctx.renderer.width;
      const baseH = ctx.renderer.height;
      const maxPanX = baseW * 0.4;
      const maxPanY = baseH * 0.5;
      const ratio = cam && typeof cam.calcDepthRatio === "function" ? cam.calcDepthRatio(zPos, 1) : 1;
      const exactW = baseW + maxPanX * 2;
      const exactH = baseH + maxPanY * 2;
      const createFn = isVideo ? ctx.renderer.world.createVideo.bind(ctx.renderer.world) : ctx.renderer.world.createImage.bind(ctx.renderer.world);
      const obj = createFn({
        attribute: { src },
        style: {
          width: exactW,
          height: exactH,
          zIndex: Z_INDEX.BACKGROUND,
          opacity,
          pointerEvents: false
        },
        transform: { position: { x: 0, y: 0, z: zPos }, scale: { x: ratio, y: ratio, z: 1 } }
      });
      if (!parallax) {
        ctx.renderer.world.camera?.addChild(obj);
      }
      ctx.renderer.track(obj);
      return obj;
    };
    if (data.key) {
      _bgObj = _createBg(data.key, data.fit, data.parallax, data.isVideo);
      _bgParallax = data.parallax;
    }
    return {
      show: (dur = 250) => {
        _bgObj?.fadeIn?.(dur, "easeOut");
      },
      hide: (dur = 300) => {
        _bgObj?.fadeOut?.(dur, "easeIn");
      },
      update: (d) => {
        if (!d.key) return;
        const bgDefs = ctx.renderer.config.backgrounds;
        const def = bgDefs[d.key];
        if (!def) return;
        const src = def.src ?? d.key;
        const useParallax = def.parallax ?? true;
        const dur = ctx.renderer.dur(d.duration);
        ctx.renderer.state.set("backgroundKey", d.key);
        if (_bgObj) {
          const sameParallax = _bgParallax === useParallax;
          if (sameParallax) {
            if (dur > 0 && typeof _bgObj.transition === "function") {
              _bgObj.transition(src, dur);
            } else {
              if (_bgObj.attribute) _bgObj.attribute.src = src;
            }
            _bgParallax = useParallax;
            return;
          }
          _bgObj.remove();
          ctx.renderer.untrack(_bgObj);
          _bgObj = null;
        }
        _bgParallax = useParallax;
        _bgObj = _createBg(d.key, d.fit, useParallax, d.isVideo, dur > 0 ? 0 : 1);
        if (dur > 0 && _bgObj) {
          ctx.renderer.animate(_bgObj, { style: { opacity: 1 } }, dur, "easeInOutQuad");
        }
      }
    };
  });
  backgroundModule.defineCommand((cmd, ctx, data) => {
    const bgDefs = ctx.renderer.config.backgrounds;
    const def = bgDefs[cmd.name];
    if (!def) return true;
    const fit = cmd.fit === "inherit" || !cmd.fit ? "cover" : cmd.fit;
    data.key = cmd.name;
    data.fit = fit;
    data.duration = cmd.duration ?? 1e3;
    data.parallax = def.parallax ?? true;
    data.isVideo = cmd.isVideo ?? false;
    return true;
  });
  var background_default = backgroundModule;
  function setBackground(ctx, name, fit, duration = 1e3, isVideo = false) {
    backgroundModule.__handler?.({ name, fit, duration, isVideo }, ctx);
  }

  // src/modules/camera.ts
  var ZOOM_PRESETS = {
    "close-up": { scale: 1.5, duration: 800 },
    "medium": { scale: 1.2, duration: 600 },
    "wide": { scale: 0.8, duration: 800 },
    "reset": { scale: 1, duration: 600 }
  };
  var PAN_PRESETS = {
    left: { x: -200, y: 0, duration: 1e3 },
    right: { x: 200, y: 0, duration: 1e3 },
    up: { x: 0, y: 200, duration: 1e3 },
    down: { x: 0, y: -200, duration: 1e3 },
    center: { x: 0, y: 0, duration: 1e3 }
  };
  var CAMERA_EFFECT_PRESETS = {
    shake: { intensity: 10, duration: 500 },
    bounce: { intensity: 15, duration: 600 },
    wave: { intensity: 20, duration: 1e3 },
    nod: { intensity: 10, duration: 400 },
    "shake-x": { intensity: 15, duration: 500 },
    fall: { intensity: 15, duration: 800 }
  };
  function zoomCamera(ctx, preset, duration) {
    const resolvedPreset = preset === "inherit" ? ctx.renderer.state.get("_lastZoomPreset") ?? "reset" : preset;
    ctx.renderer.state.set("_lastZoomPreset", resolvedPreset);
    const cfg = ZOOM_PRESETS[resolvedPreset];
    if (!cfg) return;
    const focalLength = ctx.renderer.world.camera?.attribute?.focalLength ?? 100;
    const targetZ = focalLength * (1 - 1 / cfg.scale);
    if (ctx.renderer.camBaseObj) {
      const dur = ctx.renderer.dur(duration ?? cfg.duration);
      ctx.renderer.animate(ctx.renderer.camBaseObj, { transform: { position: { z: targetZ } } }, dur, "easeInOutQuad");
    }
  }
  function panCamera(ctx, position, duration, customX, customY) {
    if (position === "inherit") return;
    const resolvedPreset = position;
    ctx.renderer.state.set("_lastPanPreset", resolvedPreset);
    const cfg = PAN_PRESETS[resolvedPreset];
    let targetX = customX ?? 0;
    let targetY = customY ?? 0;
    let finalDur = duration ?? 1e3;
    if (cfg && customX === void 0 && customY === void 0) {
      targetX = cfg.x;
      targetY = cfg.y;
      if (duration === void 0) finalDur = cfg.duration;
    } else if (typeof resolvedPreset === "string" && customX === void 0) {
      let ratio = 0.5;
      const m = resolvedPreset.match(/^(\d+)\/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        const d = parseInt(m[2], 10);
        if (d > 0) ratio = n / (d + 1);
      }
      targetX = ctx.renderer.width * (ratio - 0.5);
      targetY = 0;
    }
    if (ctx.renderer.camBaseObj) {
      ctx.renderer.animate(ctx.renderer.camBaseObj, { transform: { position: { x: targetX, y: targetY } } }, finalDur, "easeInOutQuad");
    }
  }
  function cameraEffect(ctx, preset, duration, intensity, repeat = 1) {
    if (preset === "reset") {
      const stopFn2 = ctx.renderer.state.get("_activeCamEffectStop");
      if (stopFn2) stopFn2();
      return;
    }
    const stopFn = ctx.renderer.state.get("_activeCamEffectStop");
    if (stopFn) stopFn();
    const cfg = CAMERA_EFFECT_PRESETS[preset];
    if (!cfg) return;
    const finalIntensity = intensity ?? cfg.intensity;
    const finalDuration = ctx.renderer.dur(duration ?? cfg.duration);
    if (finalDuration <= 0) return;
    const offsetObj = ctx.renderer.camOffsetObj;
    if (!offsetObj) return;
    let active = true;
    let frame = 0;
    const stop = () => {
      active = false;
      ctx.renderer.state.set("_activeCamEffectStop", null);
      offsetObj.transform.position.x = 0;
      offsetObj.transform.position.y = 0;
      if (offsetObj.transform.rotation) offsetObj.transform.rotation.z = 0;
    };
    ctx.renderer.state.set("_activeCamEffectStop", stop);
    const loop = () => {
      if (!active || frame++ >= repeat) {
        stop();
        return;
      }
      let elapsed = 0;
      const stepTime = 16;
      const tick = () => {
        if (!active) return;
        elapsed += stepTime;
        if (elapsed > finalDuration) {
          loop();
          return;
        }
        const progress = elapsed / finalDuration;
        let dx = 0, dy = 0, dz = 0;
        switch (preset) {
          case "shake":
            dx = (Math.random() - 0.5) * finalIntensity * (1 - progress);
            dy = (Math.random() - 0.5) * finalIntensity * (1 - progress);
            break;
          case "shake-x":
            dx = (Math.random() - 0.5) * finalIntensity * (1 - progress);
            break;
          case "bounce":
            dy = Math.sin(progress * Math.PI) * finalIntensity;
            break;
          case "wave":
            dx = Math.sin(progress * Math.PI * 2) * finalIntensity;
            dy = Math.cos(progress * Math.PI * 2) * (finalIntensity / 2);
            break;
          case "nod":
            dy = Math.sin(progress * Math.PI) * finalIntensity;
            break;
          case "fall":
            dy = Math.pow(progress, 2) * finalIntensity * 5;
            break;
        }
        offsetObj.transform.position.x = dx;
        offsetObj.transform.position.y = dy;
        if (offsetObj.transform.rotation) offsetObj.transform.rotation.z = dz;
        setTimeout(tick, stepTime);
      };
      tick();
    };
    loop();
  }
  var cameraZoomModule = define2({ lastPreset: "reset" });
  cameraZoomModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  cameraZoomModule.defineCommand((cmd, ctx, data) => {
    const resolved = cmd.preset === "inherit" ? data.lastPreset : cmd.preset;
    data.lastPreset = resolved;
    zoomCamera(ctx, resolved, cmd.duration);
    return true;
  });
  var cameraPanModule = define2({ lastPreset: "center" });
  cameraPanModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  cameraPanModule.defineCommand((cmd, ctx, data) => {
    const resolved = cmd.position === "inherit" ? data.lastPreset : cmd.position;
    data.lastPreset = resolved;
    panCamera(ctx, resolved, cmd.duration);
    return true;
  });
  var cameraEffectModule = define2({ lastPreset: "shake" });
  cameraEffectModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  cameraEffectModule.defineCommand((cmd, ctx, data) => {
    data.lastPreset = cmd.preset;
    cameraEffect(ctx, cmd.preset, cmd.duration, cmd.intensity, cmd.repeat);
    return true;
  });

  // src/modules/character.ts
  var CHARACTER_X_RATIO = {
    "far-left": 0.1,
    "left": 0.25,
    "center": 0.5,
    "right": 0.75,
    "far-right": 0.9
  };
  function resolvePositionX(position) {
    if (CHARACTER_X_RATIO[position] !== void 0) return CHARACTER_X_RATIO[position];
    const m = position.match(/^(\d+)\/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      const d = parseInt(m[2], 10);
      if (d > 0) return n / (d + 1);
    }
    return 0.5;
  }
  var characterModule = define2({
    characters: {}
  });
  characterModule.defineView((data, ctx) => {
    const _charObjs = {};
    const _showCharacter = (name, position, imageKey, duration, immediate = false) => {
      const charDefs = ctx.renderer.config.characters;
      const def = charDefs[name];
      if (!def) return;
      const resolvedKey = imageKey || Object.keys(def.images)[0];
      const imageDef = def.images[resolvedKey];
      if (!imageDef) return;
      const src = imageDef.src ?? resolvedKey;
      const xPos = ctx.renderer.width * (resolvePositionX(position) - 0.5);
      const zPos = ctx.renderer.world.camera?.attribute?.focalLength ?? 100;
      const dur = immediate ? 0 : ctx.renderer.dur(duration ?? 400);
      const existing = _charObjs[name];
      if (existing) {
        ctx.renderer.animate(existing, { transform: { position: { x: xPos } } }, dur, "easeInOutQuad");
        if (imageKey && imageKey !== existing._currentImageKey) {
          if (dur > 0 && typeof existing.transition === "function") {
            existing.transition(src, dur);
          } else {
            if (existing.attribute) existing.attribute.src = src;
          }
        }
        existing._currentImageKey = resolvedKey;
        return;
      }
      const obj = ctx.renderer.world.createImage({
        attribute: { src },
        style: {
          width: imageDef.width ?? 500,
          opacity: dur > 0 ? 0 : 1,
          zIndex: Z_INDEX.CHARACTER_NORMAL
        },
        transform: { position: { x: xPos, y: 0, z: zPos } }
      });
      ctx.renderer.track(obj);
      obj._currentImageKey = resolvedKey;
      _charObjs[name] = obj;
      if (dur > 0) {
        ctx.renderer.animate(obj, { style: { opacity: 1 } }, dur);
      }
    };
    const _removeCharacter = (name, duration) => {
      const obj = _charObjs[name];
      if (obj) {
        delete _charObjs[name];
        const dur = ctx.renderer.dur(duration ?? 400);
        if (dur > 0) {
          ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, "easeInOutQuad", () => {
            obj.remove();
            ctx.renderer.untrack(obj);
          });
        } else {
          obj.remove();
          ctx.renderer.untrack(obj);
        }
      }
    };
    for (const [name, info] of Object.entries(data.characters)) {
      _showCharacter(name, info.position, info.imageKey, void 0, true);
    }
    return {
      show: () => {
      },
      hide: () => {
        for (const obj of Object.values(_charObjs)) {
          obj?.fadeOut?.(300, "easeIn");
        }
      },
      // 외부에서 캐릭터 오브젝트 접근 (character-focus 등에서 사용)
      getObj: (name) => _charObjs[name],
      update: (d) => {
        const newNames = new Set(Object.keys(d.characters));
        for (const name of Object.keys(_charObjs)) {
          if (!newNames.has(name)) {
            _removeCharacter(name);
          }
        }
        for (const [name, info] of Object.entries(d.characters)) {
          _showCharacter(name, info.position, info.imageKey);
        }
      }
    };
  });
  characterModule.defineCommand((cmd, ctx, data) => {
    const newChars = { ...data.characters };
    if (cmd.action === "show") {
      const showCmd = cmd;
      const charDefs = ctx.renderer.config.characters;
      const def = charDefs[showCmd.name];
      if (!def) return true;
      const existingState = newChars[showCmd.name];
      const resolvedPosition = !showCmd.position || showCmd.position === "inherit" ? existingState?.position ?? "center" : showCmd.position;
      const resolvedKey = showCmd.image ?? Object.keys(def.images)[0];
      newChars[showCmd.name] = { position: resolvedPosition, imageKey: resolvedKey };
      data.characters = newChars;
      if (showCmd.focus) {
        const focusType = typeof showCmd.focus === "string" ? showCmd.focus : void 0;
        const focusDuration = showCmd.duration ?? 800;
        Promise.resolve().then(() => {
          const entry = ctx.ui.get("character");
          const charObj = entry?.getObj?.(showCmd.name);
          if (charObj) {
            _focusCharacter(ctx, showCmd.name, charObj, def, focusType, "inherit", focusDuration);
          }
        });
      }
    } else {
      delete newChars[cmd.name];
      data.characters = newChars;
    }
    return true;
  });
  var character_default = characterModule;
  function _focusCharacter(ctx, name, target, def, focusType, fit = "inherit", duration = 800) {
    if (!target) return;
    const activeImgKey = target._currentImageKey ?? Object.keys(def.images)[0];
    const imageDef = def.images[activeImgKey];
    const fp = focusType && imageDef?.points ? imageDef.points[focusType] : { x: 0.5, y: 0.5 };
    const targetX = target.transform?.position?.x ?? 0;
    const charW = target.style?.width ?? 500;
    const rendH = target.__renderedSize?.h;
    const charH = rendH && rendH > 0 ? rendH : charW * 2;
    const panX = targetX + charW * (fp.x - 0.5);
    const panY = charH * (0.5 - fp.y);
    panCamera(ctx, "center", duration, panX, panY);
    zoomCamera(ctx, fit, duration);
  }
  var characterFocusModule = define2({ _unused: void 0 });
  characterFocusModule.defineView((_data, _ctx) => ({
    show: () => {
    },
    hide: () => {
    }
  }));
  characterFocusModule.defineCommand((cmd, ctx) => {
    const entry = ctx.ui.get("character");
    const charObj = entry?.getObj?.(cmd.name);
    if (!charObj) return true;
    const charDefs = ctx.renderer.config.characters;
    const def = charDefs[cmd.name];
    if (!def) return true;
    _focusCharacter(ctx, cmd.name, charObj, def, cmd.point, cmd.zoom ?? "inherit", cmd.duration ?? 800);
    return true;
  });
  var characterHighlightModule = define2({ _unused: void 0 });
  characterHighlightModule.defineView((_data, _ctx) => ({
    show: () => {
    },
    hide: () => {
    }
  }));
  characterHighlightModule.defineCommand((_cmd, _ctx) => {
    return true;
  });

  // src/modules/mood.ts
  var MOOD_PRESETS = {
    day: { color: "rgba(255,230,180,0.1)", vignette: "transparent 70%, rgba(255,200,100,0.15) 100%", blendMode: "screen" },
    night: { color: "rgba(10,15,60,0.5)", vignette: "transparent 50%, rgba(0,5,25,0.6) 100%", blendMode: "multiply" },
    dawn: { color: "rgba(25,35,70,0.4)", vignette: "transparent 50%, rgba(65,122,164,0.6) 100%", blendMode: "multiply" },
    sunset: { color: "rgba(255,120,50,0.25)", vignette: "transparent 50%, rgba(255,100,50,0.4) 100%", blendMode: "screen" },
    foggy: { color: "rgba(200,210,220,0.4)", vignette: "rgba(255,255,255,0.05) 0%, rgba(150,160,170,0.4) 100%", blendMode: "screen" },
    sepia: { color: "rgba(160,110,50,0.3)", vignette: "transparent 60%, rgba(80,50,20,0.5) 100%", blendMode: "multiply" },
    cold: { color: "rgba(80,130,220,0.25)", vignette: "transparent 50%, rgba(20,40,100,0.4) 100%", blendMode: "hard-light" },
    noir: { color: "rgba(0,0,0,0.1)", vignette: "transparent 50%, rgba(0,0,0,0.6) 100%", blendMode: "luminosity" },
    horror: { color: "rgba(150,0,0,0.3)", vignette: "transparent 40%, rgba(0,0,0,0.7) 100%", blendMode: "multiply" },
    flashback: { color: "rgba(200,200,200,0.2)", vignette: "transparent 60%, rgba(255,255,255,0.5) 100%", blendMode: "screen" },
    dream: { color: "rgba(180,150,255,0.2)", vignette: "transparent 60%, rgba(255,200,255,0.4) 100%", blendMode: "screen" },
    danger: { color: "rgba(255,0,0,0.1)", vignette: "transparent 50%, rgba(200,0,0,0.5) 100%", blendMode: "color-burn" },
    none: { color: "transparent" },
    spot: { color: "radial-gradient(circle,rgba(255,240,180,0.8) 0%,transparent 70%)", blendMode: "screen", defaultIntensity: 0.6 },
    ambient: { color: "rgba(255,230,150,1)", blendMode: "screen", defaultIntensity: 0.15 },
    warm: { color: "rgba(255,160,50,1)", blendMode: "screen", defaultIntensity: 0.25 }
  };
  var moodModule = define2({
    activeMoods: {}
  });
  moodModule.defineView((data, ctx) => {
    const _moodObjs = {};
    const _addMoodObj = (mood, intensity, duration, immediate = false) => {
      if (mood === "none") {
        for (const m of Object.keys(_moodObjs)) {
          _removeMoodObj(m, duration, immediate);
        }
        return;
      }
      const { color, vignette, blendMode, defaultIntensity } = MOOD_PRESETS[mood];
      const finalIntensity = intensity ?? defaultIntensity ?? 1;
      const dur = immediate ? 0 : ctx.renderer.dur(duration);
      const cam = ctx.renderer.world.camera;
      const focalLength = cam?.attribute?.focalLength ?? 100;
      const exactW = cam && typeof cam.calcDepthRatio === "function" ? cam.calcDepthRatio(focalLength, ctx.renderer.width) : ctx.renderer.width;
      const exactH = cam && typeof cam.calcDepthRatio === "function" ? cam.calcDepthRatio(focalLength, ctx.renderer.height) : ctx.renderer.height;
      const existing = _moodObjs[mood];
      if (existing) {
        ctx.renderer.animate(existing, { style: { opacity: finalIntensity } }, dur, "easeInOutQuad");
        return;
      }
      const rectOpts = {
        style: {
          color,
          opacity: dur > 0 ? 0 : finalIntensity,
          width: exactW,
          height: exactH,
          zIndex: Z_INDEX.MOOD,
          pointerEvents: false,
          blendMode
        },
        transform: { position: { x: 0, y: 0, z: focalLength - (cam?.transform.position.z ?? 0) } }
      };
      if (vignette) {
        rectOpts.style.gradient = vignette;
        rectOpts.style.gradientType = "circular";
      }
      const rect = ctx.renderer.world.createRectangle(rectOpts);
      ctx.renderer.track(rect);
      ctx.renderer.world.camera?.addChild(rect);
      rect._currentMood = mood;
      _moodObjs[mood] = rect;
      if (dur > 0) {
        ctx.renderer.animate(rect, { style: { opacity: finalIntensity } }, dur, "easeInOutQuad");
      }
    };
    const _removeMoodObj = (mood, duration, immediate = false) => {
      const obj = _moodObjs[mood];
      if (obj) {
        delete _moodObjs[mood];
        const dur = immediate ? 0 : ctx.renderer.dur(duration);
        if (dur > 0) {
          ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, "easeInOutQuad", () => {
            obj.remove();
            ctx.renderer.untrack(obj);
          });
        } else {
          obj.remove();
          ctx.renderer.untrack(obj);
        }
      }
    };
    for (const [mood, intensity] of Object.entries(data.activeMoods)) {
      _addMoodObj(mood, intensity, 800, true);
    }
    return {
      show: () => {
      },
      hide: () => {
        for (const obj of Object.values(_moodObjs)) {
          obj?.fadeOut?.(300, "easeIn");
        }
      },
      // flicker용 오브젝트 접근
      getObj: (mood) => _moodObjs[mood],
      update: (d) => {
        const newMoods = new Set(Object.keys(d.activeMoods));
        for (const mood of Object.keys(_moodObjs)) {
          if (!newMoods.has(mood)) {
            _removeMoodObj(mood, 800);
          }
        }
        for (const [mood, intensity] of Object.entries(d.activeMoods)) {
          _addMoodObj(mood, intensity, 800);
        }
      }
    };
  });
  moodModule.defineCommand((cmd, ctx, data) => {
    const newMoods = { ...data.activeMoods };
    if (cmd.action === "remove") {
      delete newMoods[cmd.mood];
    } else {
      const addCmd = cmd;
      if (addCmd.mood === "none") {
        for (const k of Object.keys(newMoods)) delete newMoods[k];
      } else {
        const preset = MOOD_PRESETS[addCmd.mood];
        newMoods[addCmd.mood] = addCmd.intensity ?? preset?.defaultIntensity ?? 1;
      }
      if (addCmd.flicker) {
        const entry = ctx.ui.get("mood");
        const obj = entry?.getObj?.(addCmd.mood);
        if (obj) {
          _setFlicker(ctx, obj, addCmd.mood, data.activeMoods[addCmd.mood] ?? 1, addCmd.flicker);
        }
      }
    }
    data.activeMoods = newMoods;
    return true;
  });
  function _setFlicker(ctx, target, mood, baseOpacity, flickerPreset) {
    target._flickerBaseOpacity = baseOpacity;
    const configs = {
      candle: { interval: 120, range: [0.6, 1] },
      flicker: { interval: 80, range: [0.3, 1] },
      strobe: { interval: 60, range: [0, 1] }
    };
    const cfg = configs[flickerPreset];
    ctx.renderer.state.set("_flickerObj", target);
    ctx.renderer.state.set("_flickerState", { mood, preset: flickerPreset });
    const step = () => {
      if (ctx.renderer.state.get("_flickerObj") !== target) {
        ctx.renderer.animate(target, { style: { opacity: baseOpacity } }, 300, "easeInOutQuad");
        return;
      }
      const [min, max] = cfg.range;
      const next = baseOpacity * (min + Math.random() * (max - min));
      ctx.renderer.animate(target, { style: { opacity: next } }, cfg.interval, "linear", step);
    };
    step();
  }
  var mood_default = moodModule;

  // src/modules/effect.ts
  var EFFECT_PARTICLE_PRESETS = {
    dust: { attribute: { frictionAir: 0, gravityScale: 1e-3 }, style: { width: 10, height: 10, blendMode: "lighter" } },
    rain: { attribute: { gravityScale: 1.5 }, style: { width: 25, height: 100, opacity: 1, blendMode: "screen" } },
    snow: { attribute: { gravityScale: 0.01, frictionAir: 0 }, style: { width: 15, height: 15, blendMode: "lighter" } },
    sakura: { attribute: { gravityScale: 0.02, frictionAir: 0 }, style: { width: 16, height: 20, opacity: 0.8 } },
    sparkle: { attribute: { gravityScale: 0.1 }, style: { width: 16, height: 16, opacity: 0.8 } },
    fog: { attribute: { frictionAir: 0, gravityScale: 3e-3 }, style: { width: 120, height: 120, blendMode: "screen" } },
    leaves: { attribute: { gravityScale: 0.1, frictionAir: 0.05, strictPhysics: true }, style: { width: 20, height: 20, opacity: 0.9 } },
    fireflies: { attribute: { gravityScale: -0.02, frictionAir: 0.05, strictPhysics: true }, style: { width: 8, height: 8, opacity: 0.8, blendMode: "lighter" } }
  };
  var EFFECT_CLIP_PRESETS = {
    dust: { impulse: 0.05, lifespan: 1e4, interval: 250, size: [[0.5, 1], [0, 0.5]], opacity: [[0, 0], [1, 1], [0, 0]], loop: true },
    rain: { impulse: 0, lifespan: 3e3, interval: 40, size: [[0.1, 0.3], [0.1, 0.3]], opacity: [[1, 1], [1, 1]], loop: true },
    snow: { impulse: 0.01, lifespan: 1e4, interval: 100, size: [[0.3, 0.8], [0, 0]], opacity: [[1, 1], [0, 0]], loop: true, angularImpulse: 1e-3 },
    sakura: { impulse: 0.02, lifespan: 6e3, interval: 300, size: [[0.5, 0.8], [0.3, 0.5]], loop: true, angularImpulse: 1e-3 },
    sparkle: { impulse: 0.02, lifespan: 1500, interval: 150, size: [[0.5, 1], [0, 0.1]], loop: true },
    fog: { impulse: 0.01, lifespan: 15e3, interval: 800, size: [[2, 2], [5, 10]], opacity: [[0, 0], [0.1, 0.2], [0, 0]], loop: true, angularImpulse: 1e-4 },
    leaves: { impulse: 0.08, lifespan: 7e3, interval: 350, size: [[0.8, 1.2], [0.8, 1.2]], loop: true, angularImpulse: 0.05 },
    fireflies: { impulse: 0.03, lifespan: 5e3, interval: 300, size: [[0.5, 1.5], [0, 0.5]], loop: true }
  };
  var DEFAULT_EFFECT_RATES = {
    dust: 5,
    rain: 200,
    snow: 8,
    sakura: 8,
    sparkle: 10,
    fog: 4,
    leaves: 5,
    fireflies: 5
  };
  var effectModule = define2({
    activeEffects: {}
  });
  effectModule.defineView((data, ctx) => {
    const _effectObjs = {};
    const _addEffect = (type, rate, srcKey, immediate = false) => {
      const configEffect = ctx.renderer.config.effects?.[type];
      const preset = {
        attribute: { ...EFFECT_PARTICLE_PRESETS[type]?.attribute, ...configEffect?.particle?.attribute },
        style: { ...EFFECT_PARTICLE_PRESETS[type]?.style, ...configEffect?.particle?.style }
      };
      const finalRate = rate ?? DEFAULT_EFFECT_RATES[type] ?? 10;
      const clipName = `${type}_rate_${finalRate}_${srcKey ?? "default"}`;
      const particleZ = ctx.renderer.depth / 2;
      if (!ctx.renderer.world.particleManager.get(clipName)) {
        const clipBase = { ...EFFECT_CLIP_PRESETS[type], ...configEffect?.clip };
        const cam = ctx.renderer.world.camera;
        const ratio = cam && typeof cam.calcDepthRatio === "function" ? cam.calcDepthRatio(particleZ, 1) : 1;
        const maxPanX = ctx.renderer.width * 0.4;
        const maxPanY = ctx.renderer.height * 0.5;
        const spanW = (ctx.renderer.width + maxPanX * 2) * ratio;
        const spanH = (ctx.renderer.height + maxPanY * 2) * ratio;
        ctx.renderer.world.particleManager.create({
          name: clipName,
          src: srcKey ?? type,
          ...clipBase,
          rate: finalRate,
          spawnX: spanW,
          spawnY: spanH,
          spawnZ: particleZ
        });
      }
      if (_effectObjs[type]) return;
      const particle = ctx.renderer.world.createParticle({
        attribute: { ...preset.attribute, src: clipName },
        style: { ...preset.style },
        transform: { position: { x: 0, y: 0, z: particleZ } }
      });
      _effectObjs[type] = particle;
      ctx.renderer.track(particle);
      particle.play();
    };
    const _removeEffect = (type, duration, immediate = false) => {
      const effect = _effectObjs[type];
      if (effect) {
        delete _effectObjs[type];
        const dur = immediate ? 0 : ctx.renderer.dur(duration);
        if (dur > 0) {
          ctx.renderer.animate(effect, { style: { opacity: 0 } }, dur, "easeInOutQuad", () => {
            effect.remove();
            ctx.renderer.untrack(effect);
          });
        } else {
          effect.remove();
          ctx.renderer.untrack(effect);
        }
      }
    };
    for (const [type, info] of Object.entries(data.activeEffects)) {
      _addEffect(type, info.rate, info.srcKey, true);
    }
    return {
      show: () => {
      },
      hide: () => {
        for (const obj of Object.values(_effectObjs)) {
          obj?.fadeOut?.(300, "easeIn");
        }
      },
      update: (d) => {
        const newTypes = new Set(Object.keys(d.activeEffects));
        for (const type of Object.keys(_effectObjs)) {
          if (!newTypes.has(type)) _removeEffect(type, 600);
        }
        for (const [type, info] of Object.entries(d.activeEffects)) {
          if (!_effectObjs[type]) {
            _addEffect(type, info.rate, info.srcKey);
          }
        }
      }
    };
  });
  effectModule.defineCommand((rawCmd, ctx, data) => {
    const cmd = rawCmd;
    const newEffects = { ...data.activeEffects };
    if (cmd.action === "add") {
      newEffects[cmd.effect] = { rate: cmd.rate, srcKey: cmd.src };
    } else {
      delete newEffects[cmd.effect];
    }
    data.activeEffects = newEffects;
    return true;
  });
  var effect_default = effectModule;

  // src/modules/overlay.ts
  var OVERLAY_PRESETS = {
    caption: { fontSize: 24, color: "#ffffff", opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: "bottom" },
    title: { fontSize: 48, color: "#ffffff", opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: "center" },
    whisper: { fontSize: 18, color: "#cccccc", opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: "bottom" }
  };
  var overlayModule = define2({
    overlays: {}
  });
  overlayModule.defineView((data, ctx) => {
    const _overlayObjs = {};
    const _addOverlay = (preset, text, immediate = false) => {
      const defaults = OVERLAY_PRESETS[preset];
      if (!defaults) return;
      if (_overlayObjs[preset]) {
        _removeOverlay(preset, 0, true);
      }
      const yMap = {
        top: ctx.renderer.height * 0.1,
        center: ctx.renderer.height * 0.5,
        bottom: ctx.renderer.height * 0.85
      };
      const cam = ctx.renderer.world.camera;
      const pos = cam && typeof cam.canvasToLocal === "function" ? cam.canvasToLocal(ctx.renderer.width / 2, yMap[defaults.y]) : { x: 0, y: 0, z: 100 };
      const textObj = ctx.renderer.world.createText({
        attribute: { text },
        style: {
          fontSize: defaults.fontSize,
          color: defaults.color,
          opacity: defaults.opacity,
          zIndex: defaults.zIndex,
          pointerEvents: false
        },
        transform: { position: pos }
      });
      ctx.renderer.world.camera?.addChild(textObj);
      ctx.renderer.track(textObj);
      _overlayObjs[preset] = textObj;
    };
    const _removeOverlay = (preset, duration, immediate = false) => {
      const obj = _overlayObjs[preset];
      if (obj) {
        delete _overlayObjs[preset];
        const dur = immediate ? 0 : ctx.renderer.dur(duration);
        if (dur > 0) {
          ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, "easeInOutQuad", () => {
            obj.remove();
            ctx.renderer.untrack(obj);
          });
        } else {
          obj.remove();
          ctx.renderer.untrack(obj);
        }
      }
    };
    for (const [preset, text] of Object.entries(data.overlays)) {
      _addOverlay(preset, text, true);
    }
    return {
      show: () => {
      },
      hide: () => {
        for (const obj of Object.values(_overlayObjs)) {
          obj?.fadeOut?.(300, "easeIn");
        }
      },
      update: (d) => {
        const newPresets = new Set(Object.keys(d.overlays));
        for (const preset of Object.keys(_overlayObjs)) {
          if (!newPresets.has(preset)) _removeOverlay(preset, 600);
        }
        for (const [preset, text] of Object.entries(d.overlays)) {
          if (!_overlayObjs[preset]) {
            _addOverlay(preset, text);
          }
        }
      }
    };
  });
  overlayModule.defineCommand((cmd, ctx, data) => {
    const newOverlays = { ...data.overlays };
    if (cmd.action === "add") {
      if (cmd.text) newOverlays[cmd.preset ?? "caption"] = cmd.text;
    } else if (cmd.action === "remove") {
      delete newOverlays[cmd.preset ?? "caption"];
    } else if (cmd.action === "clear") {
      for (const k of Object.keys(newOverlays)) delete newOverlays[k];
    }
    data.overlays = newOverlays;
    return true;
  });
  var overlay_default = overlayModule;

  // src/modules/screen.ts
  var FADE_PRESETS = {
    black: { color: "rgba(0,0,0,1)", easing: "linear" },
    white: { color: "rgba(255,255,255,1)", easing: "linear" },
    red: { color: "rgba(200,0,0,1)", easing: "easeIn" },
    dream: { color: "rgba(200,180,255,1)", easing: "easeInOut" },
    sepia: { color: "rgba(150,100,50,1)", easing: "easeIn" }
  };
  var FLASH_PRESETS = {
    white: { color: "rgba(255,255,255,1)", duration: 300 },
    red: { color: "rgba(255,0,0,1)", duration: 300 },
    yellow: { color: "rgba(255,220,0,1)", duration: 250 }
  };
  var WIPE_PRESETS = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: 1 },
    down: { x: 0, y: -1 }
  };
  function getTransitionRect(ctx, color) {
    let rect = ctx.renderer.state.get("_transitionObj");
    if (!rect) {
      const w = ctx.renderer.world.canvas?.width ?? ctx.renderer.width;
      const h = ctx.renderer.world.canvas?.height ?? ctx.renderer.height;
      rect = ctx.renderer.world.createRectangle({
        style: {
          color,
          width: w * 2,
          height: h * 2,
          opacity: 0,
          zIndex: Z_INDEX.TRANSITION,
          pointerEvents: false
        },
        transform: { position: { x: 0, y: 0, z: 10 } }
      });
      ctx.renderer.world.camera?.addChild(rect);
      ctx.renderer.track(rect);
      ctx.renderer.state.set("_transitionObj", rect);
    } else {
      rect.style.color = color;
      rect.transform.position.x = 0;
      rect.transform.position.y = 0;
    }
    return rect;
  }
  var screenFadeModule = define2({ lastPreset: "black" });
  screenFadeModule.defineView((_data, _ctx) => ({
    show: () => {
    },
    hide: () => {
    }
  }));
  screenFadeModule.defineCommand((cmd, ctx, data) => {
    const resolvedPreset = cmd.preset === "inherit" || !cmd.preset ? data.lastPreset : cmd.preset;
    data.lastPreset = resolvedPreset;
    const cfg = FADE_PRESETS[resolvedPreset];
    if (!cfg) return true;
    const rect = getTransitionRect(ctx, cfg.color);
    const startOpacity = cmd.dir === "in" ? 1 : 0;
    const endOpacity = cmd.dir === "in" ? 0 : 1;
    rect.style.opacity = startOpacity;
    ctx.renderer.animate(rect, { style: { opacity: endOpacity } }, cmd.duration ?? 600, cfg.easing);
    return true;
  });
  var screenFlashModule = define2({ lastPreset: "white" });
  screenFlashModule.defineView((_data, _ctx) => ({
    show: () => {
    },
    hide: () => {
    }
  }));
  screenFlashModule.defineCommand((cmd, ctx, data) => {
    const resolvedPreset = cmd.preset === "inherit" || !cmd.preset ? data.lastPreset : cmd.preset;
    data.lastPreset = resolvedPreset;
    const cfg = FLASH_PRESETS[resolvedPreset];
    if (!cfg) return true;
    const rect = getTransitionRect(ctx, cfg.color);
    const flashDuration = cmd.duration ?? cfg.duration;
    const repeat = cmd.repeat ?? 1;
    let count = 0;
    const doFlash = () => {
      if (repeat >= 0 && count >= repeat) return;
      count++;
      rect.style.opacity = 1;
      const anim = ctx.renderer.animate(rect, { style: { opacity: 0 } }, flashDuration, "easeOut");
      if (anim) anim.on("end", doFlash);
    };
    doFlash();
    return true;
  });
  var screenWipeModule = define2({ lastPreset: "left", lastFadePreset: "black" });
  screenWipeModule.defineView((_data, _ctx) => ({
    show: () => {
    },
    hide: () => {
    }
  }));
  screenWipeModule.defineCommand((cmd, ctx, data) => {
    const resolvedPreset = cmd.preset === "inherit" || !cmd.preset ? data.lastPreset : cmd.preset;
    data.lastPreset = resolvedPreset;
    const cfg = WIPE_PRESETS[resolvedPreset];
    if (!cfg) return true;
    const w = ctx.renderer.world.canvas?.width ?? ctx.renderer.width;
    const h = ctx.renderer.world.canvas?.height ?? ctx.renderer.height;
    const dx = cfg.x * w * 2;
    const dy = cfg.y * h * 2;
    const fadeState = ctx.cmdState.get("screen-fade");
    const colorPreset = fadeState?.lastPreset ?? data.lastFadePreset;
    const color = FADE_PRESETS[colorPreset]?.color ?? "rgba(0,0,0,1)";
    const rect = getTransitionRect(ctx, color);
    rect.style.opacity = 1;
    if (cmd.dir === "out") {
      rect.transform.position.x = dx;
      rect.transform.position.y = dy;
      ctx.renderer.animate(rect, { transform: { position: { x: 0, y: 0 } } }, cmd.duration ?? 800, "easeInOutQuad");
    } else {
      rect.transform.position.x = 0;
      rect.transform.position.y = 0;
      ctx.renderer.animate(rect, { transform: { position: { x: dx, y: dy } } }, cmd.duration ?? 800, "easeInOutQuad");
    }
    return true;
  });

  // src/modules/condition.ts
  var conditionModule = define2({});
  conditionModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  conditionModule.defineCommand((cmd, ctx) => {
    const result = typeof cmd.if === "function" ? cmd.if(ctx.scene.getVars()) : cmd.if;
    if (result) {
      if (cmd.goto) {
        ctx.scene.jumpToLabel(cmd.goto);
        return "handled";
      } else if (cmd.next) {
        ctx.scene.end();
        ctx.scene.loadScene(cmd.next);
        return "handled";
      } else {
        return true;
      }
    } else {
      if (cmd.else) {
        if (ctx.scene.hasLabel(cmd.else)) {
          ctx.scene.jumpToLabel(cmd.else);
        } else {
          ctx.scene.end();
          ctx.scene.loadScene(cmd.else);
        }
        return "handled";
      } else if (cmd["else-next"]) {
        ctx.scene.end();
        ctx.scene.loadScene(cmd["else-next"]);
        return "handled";
      } else {
        return true;
      }
    }
  });
  var condition_default = conditionModule;

  // src/modules/var.ts
  var varModule = define2({});
  varModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  varModule.defineCommand((cmd, ctx) => {
    const nameStr = cmd.name;
    const val = cmd.value;
    if (nameStr.startsWith("_")) {
      ctx.scene.setLocalVar(nameStr, val);
    } else {
      ctx.scene.setGlobalVar(nameStr, val);
    }
    return true;
  });
  var var_default = varModule;

  // src/modules/label.ts
  var labelModule = define2({});
  labelModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  labelModule.defineCommand((_cmd, _ctx) => {
    return true;
  });
  var label_default = labelModule;

  // src/modules/ui.ts
  var uiModule = define2({});
  uiModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  uiModule.defineCommand((cmd, ctx) => {
    if (cmd.action === "show") {
      ctx.ui.show(cmd.name, cmd.duration);
    } else {
      ctx.ui.hide(cmd.name, cmd.duration);
    }
    return true;
  });
  var ui_default = uiModule;

  // src/modules/control.ts
  var controlModule = define2({ expireAt: 0 });
  controlModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  controlModule.defineCommand((cmd, ctx, data) => {
    if (cmd.action === "disable" && typeof cmd.duration === "number") {
      const expireAt = data.expireAt > Date.now() ? data.expireAt : Date.now() + cmd.duration;
      if (data.expireAt <= Date.now()) {
        data.expireAt = expireAt;
        ctx.callbacks.disableInput(cmd.duration);
      }
      if (Date.now() >= expireAt) {
        data.expireAt = 0;
        return true;
      }
      return false;
    }
    return true;
  });
  var control_default = controlModule;

  // src/define/defineNovelConfig.ts
  var BUILTIN_MODULES = {
    "dialogue": dialogue_default,
    "choice": choice_default,
    "background": background_default,
    "character": character_default,
    "character-focus": characterFocusModule,
    "character-highlight": characterHighlightModule,
    "mood": mood_default,
    "effect": effect_default,
    "overlay": overlay_default,
    "screen-fade": screenFadeModule,
    "screen-flash": screenFlashModule,
    "screen-wipe": screenWipeModule,
    "camera-zoom": cameraZoomModule,
    "camera-pan": cameraPanModule,
    "camera-effect": cameraEffectModule,
    "condition": condition_default,
    "var": var_default,
    "label": label_default,
    "ui": ui_default,
    "control": control_default
  };
  function defineNovelConfig(config) {
    const mergedModules = { ...BUILTIN_MODULES, ...config.modules ?? {} };
    return { ...config, modules: mergedModules };
  }

  // src/define/defineCharacter.ts
  function defineCharacter(def) {
    return def;
  }

  // src/define/defineScene.ts
  function defineInitial(config, initial) {
    return initial;
  }
  function defineScene({
    config,
    variables = {},
    initial,
    next
  }, dialogues) {
    return {
      kind: "dialogue",
      dialogues,
      localVars: variables,
      nextScene: next,
      initial
    };
  }

  // node_modules/leviar/dist/index.js
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var require_matter = __commonJS({
    "node_modules/matter-js/build/matter.js"(exports, module) {
      (function webpackUniversalModuleDefinition(root, factory) {
        if (typeof exports === "object" && typeof module === "object")
          module.exports = factory();
        else if (typeof define === "function" && define.amd)
          define("Matter", [], factory);
        else if (typeof exports === "object")
          exports["Matter"] = factory();
        else
          root["Matter"] = factory();
      })(exports, function() {
        return (
          /******/
          (function(modules) {
            var installedModules = {};
            function __webpack_require__(moduleId) {
              if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
              }
              var module2 = installedModules[moduleId] = {
                /******/
                i: moduleId,
                /******/
                l: false,
                /******/
                exports: {}
                /******/
              };
              modules[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
              module2.l = true;
              return module2.exports;
            }
            __webpack_require__.m = modules;
            __webpack_require__.c = installedModules;
            __webpack_require__.d = function(exports2, name, getter) {
              if (!__webpack_require__.o(exports2, name)) {
                Object.defineProperty(exports2, name, { enumerable: true, get: getter });
              }
            };
            __webpack_require__.r = function(exports2) {
              if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
              }
              Object.defineProperty(exports2, "__esModule", { value: true });
            };
            __webpack_require__.t = function(value, mode) {
              if (mode & 1) value = __webpack_require__(value);
              if (mode & 8) return value;
              if (mode & 4 && typeof value === "object" && value && value.__esModule) return value;
              var ns = /* @__PURE__ */ Object.create(null);
              __webpack_require__.r(ns);
              Object.defineProperty(ns, "default", { enumerable: true, value });
              if (mode & 2 && typeof value != "string") for (var key in value) __webpack_require__.d(ns, key, function(key2) {
                return value[key2];
              }.bind(null, key));
              return ns;
            };
            __webpack_require__.n = function(module2) {
              var getter = module2 && module2.__esModule ? (
                /******/
                (function getDefault() {
                  return module2["default"];
                })
              ) : (
                /******/
                (function getModuleExports() {
                  return module2;
                })
              );
              __webpack_require__.d(getter, "a", getter);
              return getter;
            };
            __webpack_require__.o = function(object, property) {
              return Object.prototype.hasOwnProperty.call(object, property);
            };
            __webpack_require__.p = "";
            return __webpack_require__(__webpack_require__.s = 20);
          })([
            /* 0 */
            /***/
            (function(module2, exports2) {
              var Common = {};
              module2.exports = Common;
              (function() {
                Common._baseDelta = 1e3 / 60;
                Common._nextId = 0;
                Common._seed = 0;
                Common._nowStartTime = +/* @__PURE__ */ new Date();
                Common._warnedOnce = {};
                Common._decomp = null;
                Common.extend = function(obj, deep) {
                  var argsStart, args, deepClone;
                  if (typeof deep === "boolean") {
                    argsStart = 2;
                    deepClone = deep;
                  } else {
                    argsStart = 1;
                    deepClone = true;
                  }
                  for (var i = argsStart; i < arguments.length; i++) {
                    var source = arguments[i];
                    if (source) {
                      for (var prop in source) {
                        if (deepClone && source[prop] && source[prop].constructor === Object) {
                          if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Common.extend(obj[prop], deepClone, source[prop]);
                          } else {
                            obj[prop] = source[prop];
                          }
                        } else {
                          obj[prop] = source[prop];
                        }
                      }
                    }
                  }
                  return obj;
                };
                Common.clone = function(obj, deep) {
                  return Common.extend({}, deep, obj);
                };
                Common.keys = function(obj) {
                  if (Object.keys)
                    return Object.keys(obj);
                  var keys = [];
                  for (var key in obj)
                    keys.push(key);
                  return keys;
                };
                Common.values = function(obj) {
                  var values = [];
                  if (Object.keys) {
                    var keys = Object.keys(obj);
                    for (var i = 0; i < keys.length; i++) {
                      values.push(obj[keys[i]]);
                    }
                    return values;
                  }
                  for (var key in obj)
                    values.push(obj[key]);
                  return values;
                };
                Common.get = function(obj, path, begin, end) {
                  path = path.split(".").slice(begin, end);
                  for (var i = 0; i < path.length; i += 1) {
                    obj = obj[path[i]];
                  }
                  return obj;
                };
                Common.set = function(obj, path, val, begin, end) {
                  var parts = path.split(".").slice(begin, end);
                  Common.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
                  return val;
                };
                Common.shuffle = function(array) {
                  for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Common.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                  }
                  return array;
                };
                Common.choose = function(choices) {
                  return choices[Math.floor(Common.random() * choices.length)];
                };
                Common.isElement = function(obj) {
                  if (typeof HTMLElement !== "undefined") {
                    return obj instanceof HTMLElement;
                  }
                  return !!(obj && obj.nodeType && obj.nodeName);
                };
                Common.isArray = function(obj) {
                  return Object.prototype.toString.call(obj) === "[object Array]";
                };
                Common.isFunction = function(obj) {
                  return typeof obj === "function";
                };
                Common.isPlainObject = function(obj) {
                  return typeof obj === "object" && obj.constructor === Object;
                };
                Common.isString = function(obj) {
                  return toString.call(obj) === "[object String]";
                };
                Common.clamp = function(value, min, max) {
                  if (value < min)
                    return min;
                  if (value > max)
                    return max;
                  return value;
                };
                Common.sign = function(value) {
                  return value < 0 ? -1 : 1;
                };
                Common.now = function() {
                  if (typeof window !== "undefined" && window.performance) {
                    if (window.performance.now) {
                      return window.performance.now();
                    } else if (window.performance.webkitNow) {
                      return window.performance.webkitNow();
                    }
                  }
                  if (Date.now) {
                    return Date.now();
                  }
                  return /* @__PURE__ */ new Date() - Common._nowStartTime;
                };
                Common.random = function(min, max) {
                  min = typeof min !== "undefined" ? min : 0;
                  max = typeof max !== "undefined" ? max : 1;
                  return min + _seededRandom() * (max - min);
                };
                var _seededRandom = function() {
                  Common._seed = (Common._seed * 9301 + 49297) % 233280;
                  return Common._seed / 233280;
                };
                Common.colorToNumber = function(colorString) {
                  colorString = colorString.replace("#", "");
                  if (colorString.length == 3) {
                    colorString = colorString.charAt(0) + colorString.charAt(0) + colorString.charAt(1) + colorString.charAt(1) + colorString.charAt(2) + colorString.charAt(2);
                  }
                  return parseInt(colorString, 16);
                };
                Common.logLevel = 1;
                Common.log = function() {
                  if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
                    console.log.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common.info = function() {
                  if (console && Common.logLevel > 0 && Common.logLevel <= 2) {
                    console.info.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common.warn = function() {
                  if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
                    console.warn.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
                  }
                };
                Common.warnOnce = function() {
                  var message = Array.prototype.slice.call(arguments).join(" ");
                  if (!Common._warnedOnce[message]) {
                    Common.warn(message);
                    Common._warnedOnce[message] = true;
                  }
                };
                Common.deprecated = function(obj, prop, warning) {
                  obj[prop] = Common.chain(function() {
                    Common.warnOnce("\u{1F505} deprecated \u{1F505}", warning);
                  }, obj[prop]);
                };
                Common.nextId = function() {
                  return Common._nextId++;
                };
                Common.indexOf = function(haystack, needle) {
                  if (haystack.indexOf)
                    return haystack.indexOf(needle);
                  for (var i = 0; i < haystack.length; i++) {
                    if (haystack[i] === needle)
                      return i;
                  }
                  return -1;
                };
                Common.map = function(list, func) {
                  if (list.map) {
                    return list.map(func);
                  }
                  var mapped = [];
                  for (var i = 0; i < list.length; i += 1) {
                    mapped.push(func(list[i]));
                  }
                  return mapped;
                };
                Common.topologicalSort = function(graph) {
                  var result = [], visited = [], temp = [];
                  for (var node in graph) {
                    if (!visited[node] && !temp[node]) {
                      Common._topologicalSort(node, visited, temp, graph, result);
                    }
                  }
                  return result;
                };
                Common._topologicalSort = function(node, visited, temp, graph, result) {
                  var neighbors = graph[node] || [];
                  temp[node] = true;
                  for (var i = 0; i < neighbors.length; i += 1) {
                    var neighbor = neighbors[i];
                    if (temp[neighbor]) {
                      continue;
                    }
                    if (!visited[neighbor]) {
                      Common._topologicalSort(neighbor, visited, temp, graph, result);
                    }
                  }
                  temp[node] = false;
                  visited[node] = true;
                  result.push(node);
                };
                Common.chain = function() {
                  var funcs = [];
                  for (var i = 0; i < arguments.length; i += 1) {
                    var func = arguments[i];
                    if (func._chained) {
                      funcs.push.apply(funcs, func._chained);
                    } else {
                      funcs.push(func);
                    }
                  }
                  var chain = function() {
                    var lastResult, args = new Array(arguments.length);
                    for (var i2 = 0, l = arguments.length; i2 < l; i2++) {
                      args[i2] = arguments[i2];
                    }
                    for (i2 = 0; i2 < funcs.length; i2 += 1) {
                      var result = funcs[i2].apply(lastResult, args);
                      if (typeof result !== "undefined") {
                        lastResult = result;
                      }
                    }
                    return lastResult;
                  };
                  chain._chained = funcs;
                  return chain;
                };
                Common.chainPathBefore = function(base, path, func) {
                  return Common.set(base, path, Common.chain(
                    func,
                    Common.get(base, path)
                  ));
                };
                Common.chainPathAfter = function(base, path, func) {
                  return Common.set(base, path, Common.chain(
                    Common.get(base, path),
                    func
                  ));
                };
                Common.setDecomp = function(decomp) {
                  Common._decomp = decomp;
                };
                Common.getDecomp = function() {
                  var decomp = Common._decomp;
                  try {
                    if (!decomp && typeof window !== "undefined") {
                      decomp = window.decomp;
                    }
                    if (!decomp && typeof global !== "undefined") {
                      decomp = global.decomp;
                    }
                  } catch (e) {
                    decomp = null;
                  }
                  return decomp;
                };
              })();
            }),
            /* 1 */
            /***/
            (function(module2, exports2) {
              var Bounds = {};
              module2.exports = Bounds;
              (function() {
                Bounds.create = function(vertices) {
                  var bounds = {
                    min: { x: 0, y: 0 },
                    max: { x: 0, y: 0 }
                  };
                  if (vertices)
                    Bounds.update(bounds, vertices);
                  return bounds;
                };
                Bounds.update = function(bounds, vertices, velocity) {
                  bounds.min.x = Infinity;
                  bounds.max.x = -Infinity;
                  bounds.min.y = Infinity;
                  bounds.max.y = -Infinity;
                  for (var i = 0; i < vertices.length; i++) {
                    var vertex = vertices[i];
                    if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
                    if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
                    if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
                    if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
                  }
                  if (velocity) {
                    if (velocity.x > 0) {
                      bounds.max.x += velocity.x;
                    } else {
                      bounds.min.x += velocity.x;
                    }
                    if (velocity.y > 0) {
                      bounds.max.y += velocity.y;
                    } else {
                      bounds.min.y += velocity.y;
                    }
                  }
                };
                Bounds.contains = function(bounds, point) {
                  return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
                };
                Bounds.overlaps = function(boundsA, boundsB) {
                  return boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y;
                };
                Bounds.translate = function(bounds, vector) {
                  bounds.min.x += vector.x;
                  bounds.max.x += vector.x;
                  bounds.min.y += vector.y;
                  bounds.max.y += vector.y;
                };
                Bounds.shift = function(bounds, position) {
                  var deltaX = bounds.max.x - bounds.min.x, deltaY = bounds.max.y - bounds.min.y;
                  bounds.min.x = position.x;
                  bounds.max.x = position.x + deltaX;
                  bounds.min.y = position.y;
                  bounds.max.y = position.y + deltaY;
                };
              })();
            }),
            /* 2 */
            /***/
            (function(module2, exports2) {
              var Vector = {};
              module2.exports = Vector;
              (function() {
                Vector.create = function(x, y) {
                  return { x: x || 0, y: y || 0 };
                };
                Vector.clone = function(vector) {
                  return { x: vector.x, y: vector.y };
                };
                Vector.magnitude = function(vector) {
                  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
                };
                Vector.magnitudeSquared = function(vector) {
                  return vector.x * vector.x + vector.y * vector.y;
                };
                Vector.rotate = function(vector, angle2, output) {
                  var cos = Math.cos(angle2), sin = Math.sin(angle2);
                  if (!output) output = {};
                  var x = vector.x * cos - vector.y * sin;
                  output.y = vector.x * sin + vector.y * cos;
                  output.x = x;
                  return output;
                };
                Vector.rotateAbout = function(vector, angle2, point, output) {
                  var cos = Math.cos(angle2), sin = Math.sin(angle2);
                  if (!output) output = {};
                  var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
                  output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
                  output.x = x;
                  return output;
                };
                Vector.normalise = function(vector) {
                  var magnitude = Vector.magnitude(vector);
                  if (magnitude === 0)
                    return { x: 0, y: 0 };
                  return { x: vector.x / magnitude, y: vector.y / magnitude };
                };
                Vector.dot = function(vectorA, vectorB) {
                  return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
                };
                Vector.cross = function(vectorA, vectorB) {
                  return vectorA.x * vectorB.y - vectorA.y * vectorB.x;
                };
                Vector.cross3 = function(vectorA, vectorB, vectorC) {
                  return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
                };
                Vector.add = function(vectorA, vectorB, output) {
                  if (!output) output = {};
                  output.x = vectorA.x + vectorB.x;
                  output.y = vectorA.y + vectorB.y;
                  return output;
                };
                Vector.sub = function(vectorA, vectorB, output) {
                  if (!output) output = {};
                  output.x = vectorA.x - vectorB.x;
                  output.y = vectorA.y - vectorB.y;
                  return output;
                };
                Vector.mult = function(vector, scalar) {
                  return { x: vector.x * scalar, y: vector.y * scalar };
                };
                Vector.div = function(vector, scalar) {
                  return { x: vector.x / scalar, y: vector.y / scalar };
                };
                Vector.perp = function(vector, negate2) {
                  negate2 = negate2 === true ? -1 : 1;
                  return { x: negate2 * -vector.y, y: negate2 * vector.x };
                };
                Vector.neg = function(vector) {
                  return { x: -vector.x, y: -vector.y };
                };
                Vector.angle = function(vectorA, vectorB) {
                  return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
                };
                Vector._temp = [
                  Vector.create(),
                  Vector.create(),
                  Vector.create(),
                  Vector.create(),
                  Vector.create(),
                  Vector.create()
                ];
              })();
            }),
            /* 3 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Vertices = {};
              module2.exports = Vertices;
              var Vector = __webpack_require__(2);
              var Common = __webpack_require__(0);
              (function() {
                Vertices.create = function(points, body) {
                  var vertices = [];
                  for (var i = 0; i < points.length; i++) {
                    var point = points[i], vertex = {
                      x: point.x,
                      y: point.y,
                      index: i,
                      body,
                      isInternal: false
                    };
                    vertices.push(vertex);
                  }
                  return vertices;
                };
                Vertices.fromPath = function(path, body) {
                  var pathPattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig, points = [];
                  path.replace(pathPattern, function(match, x, y) {
                    points.push({ x: parseFloat(x), y: parseFloat(y) });
                  });
                  return Vertices.create(points, body);
                };
                Vertices.centre = function(vertices) {
                  var area = Vertices.area(vertices, true), centre = { x: 0, y: 0 }, cross2, temp, j;
                  for (var i = 0; i < vertices.length; i++) {
                    j = (i + 1) % vertices.length;
                    cross2 = Vector.cross(vertices[i], vertices[j]);
                    temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross2);
                    centre = Vector.add(centre, temp);
                  }
                  return Vector.div(centre, 6 * area);
                };
                Vertices.mean = function(vertices) {
                  var average = { x: 0, y: 0 };
                  for (var i = 0; i < vertices.length; i++) {
                    average.x += vertices[i].x;
                    average.y += vertices[i].y;
                  }
                  return Vector.div(average, vertices.length);
                };
                Vertices.area = function(vertices, signed) {
                  var area = 0, j = vertices.length - 1;
                  for (var i = 0; i < vertices.length; i++) {
                    area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
                    j = i;
                  }
                  if (signed)
                    return area / 2;
                  return Math.abs(area) / 2;
                };
                Vertices.inertia = function(vertices, mass) {
                  var numerator = 0, denominator = 0, v = vertices, cross2, j;
                  for (var n = 0; n < v.length; n++) {
                    j = (n + 1) % v.length;
                    cross2 = Math.abs(Vector.cross(v[j], v[n]));
                    numerator += cross2 * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
                    denominator += cross2;
                  }
                  return mass / 6 * (numerator / denominator);
                };
                Vertices.translate = function(vertices, vector, scalar) {
                  scalar = typeof scalar !== "undefined" ? scalar : 1;
                  var verticesLength = vertices.length, translateX = vector.x * scalar, translateY = vector.y * scalar, i;
                  for (i = 0; i < verticesLength; i++) {
                    vertices[i].x += translateX;
                    vertices[i].y += translateY;
                  }
                  return vertices;
                };
                Vertices.rotate = function(vertices, angle2, point) {
                  if (angle2 === 0)
                    return;
                  var cos = Math.cos(angle2), sin = Math.sin(angle2), pointX = point.x, pointY = point.y, verticesLength = vertices.length, vertex, dx, dy, i;
                  for (i = 0; i < verticesLength; i++) {
                    vertex = vertices[i];
                    dx = vertex.x - pointX;
                    dy = vertex.y - pointY;
                    vertex.x = pointX + (dx * cos - dy * sin);
                    vertex.y = pointY + (dx * sin + dy * cos);
                  }
                  return vertices;
                };
                Vertices.contains = function(vertices, point) {
                  var pointX = point.x, pointY = point.y, verticesLength = vertices.length, vertex = vertices[verticesLength - 1], nextVertex;
                  for (var i = 0; i < verticesLength; i++) {
                    nextVertex = vertices[i];
                    if ((pointX - vertex.x) * (nextVertex.y - vertex.y) + (pointY - vertex.y) * (vertex.x - nextVertex.x) > 0) {
                      return false;
                    }
                    vertex = nextVertex;
                  }
                  return true;
                };
                Vertices.scale = function(vertices, scaleX, scaleY, point) {
                  if (scaleX === 1 && scaleY === 1)
                    return vertices;
                  point = point || Vertices.centre(vertices);
                  var vertex, delta;
                  for (var i = 0; i < vertices.length; i++) {
                    vertex = vertices[i];
                    delta = Vector.sub(vertex, point);
                    vertices[i].x = point.x + delta.x * scaleX;
                    vertices[i].y = point.y + delta.y * scaleY;
                  }
                  return vertices;
                };
                Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
                  if (typeof radius === "number") {
                    radius = [radius];
                  } else {
                    radius = radius || [8];
                  }
                  quality = typeof quality !== "undefined" ? quality : -1;
                  qualityMin = qualityMin || 2;
                  qualityMax = qualityMax || 14;
                  var newVertices = [];
                  for (var i = 0; i < vertices.length; i++) {
                    var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1], vertex = vertices[i], nextVertex = vertices[(i + 1) % vertices.length], currentRadius = radius[i < radius.length ? i : radius.length - 1];
                    if (currentRadius === 0) {
                      newVertices.push(vertex);
                      continue;
                    }
                    var prevNormal = Vector.normalise({
                      x: vertex.y - prevVertex.y,
                      y: prevVertex.x - vertex.x
                    });
                    var nextNormal = Vector.normalise({
                      x: nextVertex.y - vertex.y,
                      y: vertex.x - nextVertex.x
                    });
                    var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)), radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius), midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5)), scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));
                    var precision = quality;
                    if (quality === -1) {
                      precision = Math.pow(currentRadius, 0.32) * 1.75;
                    }
                    precision = Common.clamp(precision, qualityMin, qualityMax);
                    if (precision % 2 === 1)
                      precision += 1;
                    var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)), theta = alpha / precision;
                    for (var j = 0; j < precision; j++) {
                      newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
                    }
                  }
                  return newVertices;
                };
                Vertices.clockwiseSort = function(vertices) {
                  var centre = Vertices.mean(vertices);
                  vertices.sort(function(vertexA, vertexB) {
                    return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
                  });
                  return vertices;
                };
                Vertices.isConvex = function(vertices) {
                  var flag = 0, n = vertices.length, i, j, k, z;
                  if (n < 3)
                    return null;
                  for (i = 0; i < n; i++) {
                    j = (i + 1) % n;
                    k = (i + 2) % n;
                    z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
                    z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);
                    if (z < 0) {
                      flag |= 1;
                    } else if (z > 0) {
                      flag |= 2;
                    }
                    if (flag === 3) {
                      return false;
                    }
                  }
                  if (flag !== 0) {
                    return true;
                  } else {
                    return null;
                  }
                };
                Vertices.hull = function(vertices) {
                  var upper = [], lower = [], vertex, i;
                  vertices = vertices.slice(0);
                  vertices.sort(function(vertexA, vertexB) {
                    var dx = vertexA.x - vertexB.x;
                    return dx !== 0 ? dx : vertexA.y - vertexB.y;
                  });
                  for (i = 0; i < vertices.length; i += 1) {
                    vertex = vertices[i];
                    while (lower.length >= 2 && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                      lower.pop();
                    }
                    lower.push(vertex);
                  }
                  for (i = vertices.length - 1; i >= 0; i -= 1) {
                    vertex = vertices[i];
                    while (upper.length >= 2 && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                      upper.pop();
                    }
                    upper.push(vertex);
                  }
                  upper.pop();
                  lower.pop();
                  return upper.concat(lower);
                };
              })();
            }),
            /* 4 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Body = {};
              module2.exports = Body;
              var Vertices = __webpack_require__(3);
              var Vector = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Common = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              var Axes = __webpack_require__(11);
              (function() {
                Body._timeCorrection = true;
                Body._inertiaScale = 4;
                Body._nextCollidingGroupId = 1;
                Body._nextNonCollidingGroupId = -1;
                Body._nextCategory = 1;
                Body._baseDelta = 1e3 / 60;
                Body.create = function(options) {
                  var defaults = {
                    id: Common.nextId(),
                    type: "body",
                    label: "Body",
                    parts: [],
                    plugin: {},
                    angle: 0,
                    vertices: Vertices.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
                    position: { x: 0, y: 0 },
                    force: { x: 0, y: 0 },
                    torque: 0,
                    positionImpulse: { x: 0, y: 0 },
                    constraintImpulse: { x: 0, y: 0, angle: 0 },
                    totalContacts: 0,
                    speed: 0,
                    angularSpeed: 0,
                    velocity: { x: 0, y: 0 },
                    angularVelocity: 0,
                    isSensor: false,
                    isStatic: false,
                    isSleeping: false,
                    motion: 0,
                    sleepThreshold: 60,
                    density: 1e-3,
                    restitution: 0,
                    friction: 0.1,
                    frictionStatic: 0.5,
                    frictionAir: 0.01,
                    collisionFilter: {
                      category: 1,
                      mask: 4294967295,
                      group: 0
                    },
                    slop: 0.05,
                    timeScale: 1,
                    render: {
                      visible: true,
                      opacity: 1,
                      strokeStyle: null,
                      fillStyle: null,
                      lineWidth: null,
                      sprite: {
                        xScale: 1,
                        yScale: 1,
                        xOffset: 0,
                        yOffset: 0
                      }
                    },
                    events: null,
                    bounds: null,
                    chamfer: null,
                    circleRadius: 0,
                    positionPrev: null,
                    anglePrev: 0,
                    parent: null,
                    axes: null,
                    area: 0,
                    mass: 0,
                    inertia: 0,
                    deltaTime: 1e3 / 60,
                    _original: null
                  };
                  var body = Common.extend(defaults, options);
                  _initProperties(body, options);
                  return body;
                };
                Body.nextGroup = function(isNonColliding) {
                  if (isNonColliding)
                    return Body._nextNonCollidingGroupId--;
                  return Body._nextCollidingGroupId++;
                };
                Body.nextCategory = function() {
                  Body._nextCategory = Body._nextCategory << 1;
                  return Body._nextCategory;
                };
                var _initProperties = function(body, options) {
                  options = options || {};
                  Body.set(body, {
                    bounds: body.bounds || Bounds.create(body.vertices),
                    positionPrev: body.positionPrev || Vector.clone(body.position),
                    anglePrev: body.anglePrev || body.angle,
                    vertices: body.vertices,
                    parts: body.parts || [body],
                    isStatic: body.isStatic,
                    isSleeping: body.isSleeping,
                    parent: body.parent || body
                  });
                  Vertices.rotate(body.vertices, body.angle, body.position);
                  Axes.rotate(body.axes, body.angle);
                  Bounds.update(body.bounds, body.vertices, body.velocity);
                  Body.set(body, {
                    axes: options.axes || body.axes,
                    area: options.area || body.area,
                    mass: options.mass || body.mass,
                    inertia: options.inertia || body.inertia
                  });
                  var defaultFillStyle = body.isStatic ? "#14151f" : Common.choose(["#f19648", "#f5d259", "#f55a3c", "#063e7b", "#ececd1"]), defaultStrokeStyle = body.isStatic ? "#555" : "#ccc", defaultLineWidth = body.isStatic && body.render.fillStyle === null ? 1 : 0;
                  body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
                  body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
                  body.render.lineWidth = body.render.lineWidth || defaultLineWidth;
                  body.render.sprite.xOffset += -(body.bounds.min.x - body.position.x) / (body.bounds.max.x - body.bounds.min.x);
                  body.render.sprite.yOffset += -(body.bounds.min.y - body.position.y) / (body.bounds.max.y - body.bounds.min.y);
                };
                Body.set = function(body, settings, value) {
                  var property;
                  if (typeof settings === "string") {
                    property = settings;
                    settings = {};
                    settings[property] = value;
                  }
                  for (property in settings) {
                    if (!Object.prototype.hasOwnProperty.call(settings, property))
                      continue;
                    value = settings[property];
                    switch (property) {
                      case "isStatic":
                        Body.setStatic(body, value);
                        break;
                      case "isSleeping":
                        Sleeping.set(body, value);
                        break;
                      case "mass":
                        Body.setMass(body, value);
                        break;
                      case "density":
                        Body.setDensity(body, value);
                        break;
                      case "inertia":
                        Body.setInertia(body, value);
                        break;
                      case "vertices":
                        Body.setVertices(body, value);
                        break;
                      case "position":
                        Body.setPosition(body, value);
                        break;
                      case "angle":
                        Body.setAngle(body, value);
                        break;
                      case "velocity":
                        Body.setVelocity(body, value);
                        break;
                      case "angularVelocity":
                        Body.setAngularVelocity(body, value);
                        break;
                      case "speed":
                        Body.setSpeed(body, value);
                        break;
                      case "angularSpeed":
                        Body.setAngularSpeed(body, value);
                        break;
                      case "parts":
                        Body.setParts(body, value);
                        break;
                      case "centre":
                        Body.setCentre(body, value);
                        break;
                      default:
                        body[property] = value;
                    }
                  }
                };
                Body.setStatic = function(body, isStatic) {
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    if (isStatic) {
                      if (!part.isStatic) {
                        part._original = {
                          restitution: part.restitution,
                          friction: part.friction,
                          mass: part.mass,
                          inertia: part.inertia,
                          density: part.density,
                          inverseMass: part.inverseMass,
                          inverseInertia: part.inverseInertia
                        };
                      }
                      part.restitution = 0;
                      part.friction = 1;
                      part.mass = part.inertia = part.density = Infinity;
                      part.inverseMass = part.inverseInertia = 0;
                      part.positionPrev.x = part.position.x;
                      part.positionPrev.y = part.position.y;
                      part.anglePrev = part.angle;
                      part.angularVelocity = 0;
                      part.speed = 0;
                      part.angularSpeed = 0;
                      part.motion = 0;
                    } else if (part._original) {
                      part.restitution = part._original.restitution;
                      part.friction = part._original.friction;
                      part.mass = part._original.mass;
                      part.inertia = part._original.inertia;
                      part.density = part._original.density;
                      part.inverseMass = part._original.inverseMass;
                      part.inverseInertia = part._original.inverseInertia;
                      part._original = null;
                    }
                    part.isStatic = isStatic;
                  }
                };
                Body.setMass = function(body, mass) {
                  var moment = body.inertia / (body.mass / 6);
                  body.inertia = moment * (mass / 6);
                  body.inverseInertia = 1 / body.inertia;
                  body.mass = mass;
                  body.inverseMass = 1 / body.mass;
                  body.density = body.mass / body.area;
                };
                Body.setDensity = function(body, density) {
                  Body.setMass(body, density * body.area);
                  body.density = density;
                };
                Body.setInertia = function(body, inertia) {
                  body.inertia = inertia;
                  body.inverseInertia = 1 / body.inertia;
                };
                Body.setVertices = function(body, vertices) {
                  if (vertices[0].body === body) {
                    body.vertices = vertices;
                  } else {
                    body.vertices = Vertices.create(vertices, body);
                  }
                  body.axes = Axes.fromVertices(body.vertices);
                  body.area = Vertices.area(body.vertices);
                  Body.setMass(body, body.density * body.area);
                  var centre = Vertices.centre(body.vertices);
                  Vertices.translate(body.vertices, centre, -1);
                  Body.setInertia(body, Body._inertiaScale * Vertices.inertia(body.vertices, body.mass));
                  Vertices.translate(body.vertices, body.position);
                  Bounds.update(body.bounds, body.vertices, body.velocity);
                };
                Body.setParts = function(body, parts, autoHull) {
                  var i;
                  parts = parts.slice(0);
                  body.parts.length = 0;
                  body.parts.push(body);
                  body.parent = body;
                  for (i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    if (part !== body) {
                      part.parent = body;
                      body.parts.push(part);
                    }
                  }
                  if (body.parts.length === 1)
                    return;
                  autoHull = typeof autoHull !== "undefined" ? autoHull : true;
                  if (autoHull) {
                    var vertices = [];
                    for (i = 0; i < parts.length; i++) {
                      vertices = vertices.concat(parts[i].vertices);
                    }
                    Vertices.clockwiseSort(vertices);
                    var hull = Vertices.hull(vertices), hullCentre = Vertices.centre(hull);
                    Body.setVertices(body, hull);
                    Vertices.translate(body.vertices, hullCentre);
                  }
                  var total = Body._totalProperties(body);
                  body.area = total.area;
                  body.parent = body;
                  body.position.x = total.centre.x;
                  body.position.y = total.centre.y;
                  body.positionPrev.x = total.centre.x;
                  body.positionPrev.y = total.centre.y;
                  Body.setMass(body, total.mass);
                  Body.setInertia(body, total.inertia);
                  Body.setPosition(body, total.centre);
                };
                Body.setCentre = function(body, centre, relative) {
                  if (!relative) {
                    body.positionPrev.x = centre.x - (body.position.x - body.positionPrev.x);
                    body.positionPrev.y = centre.y - (body.position.y - body.positionPrev.y);
                    body.position.x = centre.x;
                    body.position.y = centre.y;
                  } else {
                    body.positionPrev.x += centre.x;
                    body.positionPrev.y += centre.y;
                    body.position.x += centre.x;
                    body.position.y += centre.y;
                  }
                };
                Body.setPosition = function(body, position, updateVelocity) {
                  var delta = Vector.sub(position, body.position);
                  if (updateVelocity) {
                    body.positionPrev.x = body.position.x;
                    body.positionPrev.y = body.position.y;
                    body.velocity.x = delta.x;
                    body.velocity.y = delta.y;
                    body.speed = Vector.magnitude(delta);
                  } else {
                    body.positionPrev.x += delta.x;
                    body.positionPrev.y += delta.y;
                  }
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    part.position.x += delta.x;
                    part.position.y += delta.y;
                    Vertices.translate(part.vertices, delta);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                  }
                };
                Body.setAngle = function(body, angle2, updateVelocity) {
                  var delta = angle2 - body.angle;
                  if (updateVelocity) {
                    body.anglePrev = body.angle;
                    body.angularVelocity = delta;
                    body.angularSpeed = Math.abs(delta);
                  } else {
                    body.anglePrev += delta;
                  }
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    part.angle += delta;
                    Vertices.rotate(part.vertices, delta, body.position);
                    Axes.rotate(part.axes, delta);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                    if (i > 0) {
                      Vector.rotateAbout(part.position, delta, body.position, part.position);
                    }
                  }
                };
                Body.setVelocity = function(body, velocity) {
                  var timeScale = body.deltaTime / Body._baseDelta;
                  body.positionPrev.x = body.position.x - velocity.x * timeScale;
                  body.positionPrev.y = body.position.y - velocity.y * timeScale;
                  body.velocity.x = (body.position.x - body.positionPrev.x) / timeScale;
                  body.velocity.y = (body.position.y - body.positionPrev.y) / timeScale;
                  body.speed = Vector.magnitude(body.velocity);
                };
                Body.getVelocity = function(body) {
                  var timeScale = Body._baseDelta / body.deltaTime;
                  return {
                    x: (body.position.x - body.positionPrev.x) * timeScale,
                    y: (body.position.y - body.positionPrev.y) * timeScale
                  };
                };
                Body.getSpeed = function(body) {
                  return Vector.magnitude(Body.getVelocity(body));
                };
                Body.setSpeed = function(body, speed) {
                  Body.setVelocity(body, Vector.mult(Vector.normalise(Body.getVelocity(body)), speed));
                };
                Body.setAngularVelocity = function(body, velocity) {
                  var timeScale = body.deltaTime / Body._baseDelta;
                  body.anglePrev = body.angle - velocity * timeScale;
                  body.angularVelocity = (body.angle - body.anglePrev) / timeScale;
                  body.angularSpeed = Math.abs(body.angularVelocity);
                };
                Body.getAngularVelocity = function(body) {
                  return (body.angle - body.anglePrev) * Body._baseDelta / body.deltaTime;
                };
                Body.getAngularSpeed = function(body) {
                  return Math.abs(Body.getAngularVelocity(body));
                };
                Body.setAngularSpeed = function(body, speed) {
                  Body.setAngularVelocity(body, Common.sign(Body.getAngularVelocity(body)) * speed);
                };
                Body.translate = function(body, translation, updateVelocity) {
                  Body.setPosition(body, Vector.add(body.position, translation), updateVelocity);
                };
                Body.rotate = function(body, rotation, point, updateVelocity) {
                  if (!point) {
                    Body.setAngle(body, body.angle + rotation, updateVelocity);
                  } else {
                    var cos = Math.cos(rotation), sin = Math.sin(rotation), dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body.setPosition(body, {
                      x: point.x + (dx * cos - dy * sin),
                      y: point.y + (dx * sin + dy * cos)
                    }, updateVelocity);
                    Body.setAngle(body, body.angle + rotation, updateVelocity);
                  }
                };
                Body.scale = function(body, scaleX, scaleY, point) {
                  var totalArea = 0, totalInertia = 0;
                  point = point || body.position;
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    Vertices.scale(part.vertices, scaleX, scaleY, point);
                    part.axes = Axes.fromVertices(part.vertices);
                    part.area = Vertices.area(part.vertices);
                    Body.setMass(part, body.density * part.area);
                    Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
                    Body.setInertia(part, Body._inertiaScale * Vertices.inertia(part.vertices, part.mass));
                    Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });
                    if (i > 0) {
                      totalArea += part.area;
                      totalInertia += part.inertia;
                    }
                    part.position.x = point.x + (part.position.x - point.x) * scaleX;
                    part.position.y = point.y + (part.position.y - point.y) * scaleY;
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                  }
                  if (body.parts.length > 1) {
                    body.area = totalArea;
                    if (!body.isStatic) {
                      Body.setMass(body, body.density * totalArea);
                      Body.setInertia(body, totalInertia);
                    }
                  }
                  if (body.circleRadius) {
                    if (scaleX === scaleY) {
                      body.circleRadius *= scaleX;
                    } else {
                      body.circleRadius = null;
                    }
                  }
                };
                Body.update = function(body, deltaTime) {
                  deltaTime = (typeof deltaTime !== "undefined" ? deltaTime : 1e3 / 60) * body.timeScale;
                  var deltaTimeSquared = deltaTime * deltaTime, correction = Body._timeCorrection ? deltaTime / (body.deltaTime || deltaTime) : 1;
                  var frictionAir = 1 - body.frictionAir * (deltaTime / Common._baseDelta), velocityPrevX = (body.position.x - body.positionPrev.x) * correction, velocityPrevY = (body.position.y - body.positionPrev.y) * correction;
                  body.velocity.x = velocityPrevX * frictionAir + body.force.x / body.mass * deltaTimeSquared;
                  body.velocity.y = velocityPrevY * frictionAir + body.force.y / body.mass * deltaTimeSquared;
                  body.positionPrev.x = body.position.x;
                  body.positionPrev.y = body.position.y;
                  body.position.x += body.velocity.x;
                  body.position.y += body.velocity.y;
                  body.deltaTime = deltaTime;
                  body.angularVelocity = (body.angle - body.anglePrev) * frictionAir * correction + body.torque / body.inertia * deltaTimeSquared;
                  body.anglePrev = body.angle;
                  body.angle += body.angularVelocity;
                  for (var i = 0; i < body.parts.length; i++) {
                    var part = body.parts[i];
                    Vertices.translate(part.vertices, body.velocity);
                    if (i > 0) {
                      part.position.x += body.velocity.x;
                      part.position.y += body.velocity.y;
                    }
                    if (body.angularVelocity !== 0) {
                      Vertices.rotate(part.vertices, body.angularVelocity, body.position);
                      Axes.rotate(part.axes, body.angularVelocity);
                      if (i > 0) {
                        Vector.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                      }
                    }
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                  }
                };
                Body.updateVelocities = function(body) {
                  var timeScale = Body._baseDelta / body.deltaTime, bodyVelocity = body.velocity;
                  bodyVelocity.x = (body.position.x - body.positionPrev.x) * timeScale;
                  bodyVelocity.y = (body.position.y - body.positionPrev.y) * timeScale;
                  body.speed = Math.sqrt(bodyVelocity.x * bodyVelocity.x + bodyVelocity.y * bodyVelocity.y);
                  body.angularVelocity = (body.angle - body.anglePrev) * timeScale;
                  body.angularSpeed = Math.abs(body.angularVelocity);
                };
                Body.applyForce = function(body, position, force) {
                  var offset = { x: position.x - body.position.x, y: position.y - body.position.y };
                  body.force.x += force.x;
                  body.force.y += force.y;
                  body.torque += offset.x * force.y - offset.y * force.x;
                };
                Body._totalProperties = function(body) {
                  var properties = {
                    mass: 0,
                    area: 0,
                    inertia: 0,
                    centre: { x: 0, y: 0 }
                  };
                  for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
                    var part = body.parts[i], mass = part.mass !== Infinity ? part.mass : 1;
                    properties.mass += mass;
                    properties.area += part.area;
                    properties.inertia += part.inertia;
                    properties.centre = Vector.add(properties.centre, Vector.mult(part.position, mass));
                  }
                  properties.centre = Vector.div(properties.centre, properties.mass);
                  return properties;
                };
              })();
            }),
            /* 5 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Events = {};
              module2.exports = Events;
              var Common = __webpack_require__(0);
              (function() {
                Events.on = function(object, eventNames, callback) {
                  var names = eventNames.split(" "), name;
                  for (var i = 0; i < names.length; i++) {
                    name = names[i];
                    object.events = object.events || {};
                    object.events[name] = object.events[name] || [];
                    object.events[name].push(callback);
                  }
                  return callback;
                };
                Events.off = function(object, eventNames, callback) {
                  if (!eventNames) {
                    object.events = {};
                    return;
                  }
                  if (typeof eventNames === "function") {
                    callback = eventNames;
                    eventNames = Common.keys(object.events).join(" ");
                  }
                  var names = eventNames.split(" ");
                  for (var i = 0; i < names.length; i++) {
                    var callbacks = object.events[names[i]], newCallbacks = [];
                    if (callback && callbacks) {
                      for (var j = 0; j < callbacks.length; j++) {
                        if (callbacks[j] !== callback)
                          newCallbacks.push(callbacks[j]);
                      }
                    }
                    object.events[names[i]] = newCallbacks;
                  }
                };
                Events.trigger = function(object, eventNames, event) {
                  var names, name, callbacks, eventClone;
                  var events = object.events;
                  if (events && Common.keys(events).length > 0) {
                    if (!event)
                      event = {};
                    names = eventNames.split(" ");
                    for (var i = 0; i < names.length; i++) {
                      name = names[i];
                      callbacks = events[name];
                      if (callbacks) {
                        eventClone = Common.clone(event, false);
                        eventClone.name = name;
                        eventClone.source = object;
                        for (var j = 0; j < callbacks.length; j++) {
                          callbacks[j].apply(object, [eventClone]);
                        }
                      }
                    }
                  }
                };
              })();
            }),
            /* 6 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Composite = {};
              module2.exports = Composite;
              var Events = __webpack_require__(5);
              var Common = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              var Body = __webpack_require__(4);
              (function() {
                Composite.create = function(options) {
                  return Common.extend({
                    id: Common.nextId(),
                    type: "composite",
                    parent: null,
                    isModified: false,
                    bodies: [],
                    constraints: [],
                    composites: [],
                    label: "Composite",
                    plugin: {},
                    cache: {
                      allBodies: null,
                      allConstraints: null,
                      allComposites: null
                    }
                  }, options);
                };
                Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
                  composite.isModified = isModified;
                  if (isModified && composite.cache) {
                    composite.cache.allBodies = null;
                    composite.cache.allConstraints = null;
                    composite.cache.allComposites = null;
                  }
                  if (updateParents && composite.parent) {
                    Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
                  }
                  if (updateChildren) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      var childComposite = composite.composites[i];
                      Composite.setModified(childComposite, isModified, updateParents, updateChildren);
                    }
                  }
                };
                Composite.add = function(composite, object) {
                  var objects = [].concat(object);
                  Events.trigger(composite, "beforeAdd", { object });
                  for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    switch (obj.type) {
                      case "body":
                        if (obj.parent !== obj) {
                          Common.warn("Composite.add: skipped adding a compound body part (you must add its parent instead)");
                          break;
                        }
                        Composite.addBody(composite, obj);
                        break;
                      case "constraint":
                        Composite.addConstraint(composite, obj);
                        break;
                      case "composite":
                        Composite.addComposite(composite, obj);
                        break;
                      case "mouseConstraint":
                        Composite.addConstraint(composite, obj.constraint);
                        break;
                    }
                  }
                  Events.trigger(composite, "afterAdd", { object });
                  return composite;
                };
                Composite.remove = function(composite, object, deep) {
                  var objects = [].concat(object);
                  Events.trigger(composite, "beforeRemove", { object });
                  for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    switch (obj.type) {
                      case "body":
                        Composite.removeBody(composite, obj, deep);
                        break;
                      case "constraint":
                        Composite.removeConstraint(composite, obj, deep);
                        break;
                      case "composite":
                        Composite.removeComposite(composite, obj, deep);
                        break;
                      case "mouseConstraint":
                        Composite.removeConstraint(composite, obj.constraint);
                        break;
                    }
                  }
                  Events.trigger(composite, "afterRemove", { object });
                  return composite;
                };
                Composite.addComposite = function(compositeA, compositeB) {
                  compositeA.composites.push(compositeB);
                  compositeB.parent = compositeA;
                  Composite.setModified(compositeA, true, true, false);
                  return compositeA;
                };
                Composite.removeComposite = function(compositeA, compositeB, deep) {
                  var position = Common.indexOf(compositeA.composites, compositeB);
                  if (position !== -1) {
                    var bodies = Composite.allBodies(compositeB);
                    Composite.removeCompositeAt(compositeA, position);
                    for (var i = 0; i < bodies.length; i++) {
                      bodies[i].sleepCounter = 0;
                    }
                  }
                  if (deep) {
                    for (var i = 0; i < compositeA.composites.length; i++) {
                      Composite.removeComposite(compositeA.composites[i], compositeB, true);
                    }
                  }
                  return compositeA;
                };
                Composite.removeCompositeAt = function(composite, position) {
                  composite.composites.splice(position, 1);
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.addBody = function(composite, body) {
                  composite.bodies.push(body);
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.removeBody = function(composite, body, deep) {
                  var position = Common.indexOf(composite.bodies, body);
                  if (position !== -1) {
                    Composite.removeBodyAt(composite, position);
                    body.sleepCounter = 0;
                  }
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite.removeBody(composite.composites[i], body, true);
                    }
                  }
                  return composite;
                };
                Composite.removeBodyAt = function(composite, position) {
                  composite.bodies.splice(position, 1);
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.addConstraint = function(composite, constraint) {
                  composite.constraints.push(constraint);
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.removeConstraint = function(composite, constraint, deep) {
                  var position = Common.indexOf(composite.constraints, constraint);
                  if (position !== -1) {
                    Composite.removeConstraintAt(composite, position);
                  }
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite.removeConstraint(composite.composites[i], constraint, true);
                    }
                  }
                  return composite;
                };
                Composite.removeConstraintAt = function(composite, position) {
                  composite.constraints.splice(position, 1);
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.clear = function(composite, keepStatic, deep) {
                  if (deep) {
                    for (var i = 0; i < composite.composites.length; i++) {
                      Composite.clear(composite.composites[i], keepStatic, true);
                    }
                  }
                  if (keepStatic) {
                    composite.bodies = composite.bodies.filter(function(body) {
                      return body.isStatic;
                    });
                  } else {
                    composite.bodies.length = 0;
                  }
                  composite.constraints.length = 0;
                  composite.composites.length = 0;
                  Composite.setModified(composite, true, true, false);
                  return composite;
                };
                Composite.allBodies = function(composite) {
                  if (composite.cache && composite.cache.allBodies) {
                    return composite.cache.allBodies;
                  }
                  var bodies = [].concat(composite.bodies);
                  for (var i = 0; i < composite.composites.length; i++)
                    bodies = bodies.concat(Composite.allBodies(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allBodies = bodies;
                  }
                  return bodies;
                };
                Composite.allConstraints = function(composite) {
                  if (composite.cache && composite.cache.allConstraints) {
                    return composite.cache.allConstraints;
                  }
                  var constraints = [].concat(composite.constraints);
                  for (var i = 0; i < composite.composites.length; i++)
                    constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allConstraints = constraints;
                  }
                  return constraints;
                };
                Composite.allComposites = function(composite) {
                  if (composite.cache && composite.cache.allComposites) {
                    return composite.cache.allComposites;
                  }
                  var composites = [].concat(composite.composites);
                  for (var i = 0; i < composite.composites.length; i++)
                    composites = composites.concat(Composite.allComposites(composite.composites[i]));
                  if (composite.cache) {
                    composite.cache.allComposites = composites;
                  }
                  return composites;
                };
                Composite.get = function(composite, id, type) {
                  var objects, object;
                  switch (type) {
                    case "body":
                      objects = Composite.allBodies(composite);
                      break;
                    case "constraint":
                      objects = Composite.allConstraints(composite);
                      break;
                    case "composite":
                      objects = Composite.allComposites(composite).concat(composite);
                      break;
                  }
                  if (!objects)
                    return null;
                  object = objects.filter(function(object2) {
                    return object2.id.toString() === id.toString();
                  });
                  return object.length === 0 ? null : object[0];
                };
                Composite.move = function(compositeA, objects, compositeB) {
                  Composite.remove(compositeA, objects);
                  Composite.add(compositeB, objects);
                  return compositeA;
                };
                Composite.rebase = function(composite) {
                  var objects = Composite.allBodies(composite).concat(Composite.allConstraints(composite)).concat(Composite.allComposites(composite));
                  for (var i = 0; i < objects.length; i++) {
                    objects[i].id = Common.nextId();
                  }
                  return composite;
                };
                Composite.translate = function(composite, translation, recursive) {
                  var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    Body.translate(bodies[i], translation);
                  }
                  return composite;
                };
                Composite.rotate = function(composite, rotation, point, recursive) {
                  var cos = Math.cos(rotation), sin = Math.sin(rotation), bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body.setPosition(body, {
                      x: point.x + (dx * cos - dy * sin),
                      y: point.y + (dx * sin + dy * cos)
                    });
                    Body.rotate(body, rotation);
                  }
                  return composite;
                };
                Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
                  var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
                    Body.setPosition(body, {
                      x: point.x + dx * scaleX,
                      y: point.y + dy * scaleY
                    });
                    Body.scale(body, scaleX, scaleY);
                  }
                  return composite;
                };
                Composite.bounds = function(composite) {
                  var bodies = Composite.allBodies(composite), vertices = [];
                  for (var i = 0; i < bodies.length; i += 1) {
                    var body = bodies[i];
                    vertices.push(body.bounds.min, body.bounds.max);
                  }
                  return Bounds.create(vertices);
                };
              })();
            }),
            /* 7 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Sleeping = {};
              module2.exports = Sleeping;
              var Body = __webpack_require__(4);
              var Events = __webpack_require__(5);
              var Common = __webpack_require__(0);
              (function() {
                Sleeping._motionWakeThreshold = 0.18;
                Sleeping._motionSleepThreshold = 0.08;
                Sleeping._minBias = 0.9;
                Sleeping.update = function(bodies, delta) {
                  var timeScale = delta / Common._baseDelta, motionSleepThreshold = Sleeping._motionSleepThreshold;
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], speed = Body.getSpeed(body), angularSpeed = Body.getAngularSpeed(body), motion = speed * speed + angularSpeed * angularSpeed;
                    if (body.force.x !== 0 || body.force.y !== 0) {
                      Sleeping.set(body, false);
                      continue;
                    }
                    var minMotion = Math.min(body.motion, motion), maxMotion = Math.max(body.motion, motion);
                    body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
                    if (body.sleepThreshold > 0 && body.motion < motionSleepThreshold) {
                      body.sleepCounter += 1;
                      if (body.sleepCounter >= body.sleepThreshold / timeScale) {
                        Sleeping.set(body, true);
                      }
                    } else if (body.sleepCounter > 0) {
                      body.sleepCounter -= 1;
                    }
                  }
                };
                Sleeping.afterCollisions = function(pairs) {
                  var motionSleepThreshold = Sleeping._motionSleepThreshold;
                  for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    var collision = pair.collision, bodyA = collision.bodyA.parent, bodyB = collision.bodyB.parent;
                    if (bodyA.isSleeping && bodyB.isSleeping || bodyA.isStatic || bodyB.isStatic)
                      continue;
                    if (bodyA.isSleeping || bodyB.isSleeping) {
                      var sleepingBody = bodyA.isSleeping && !bodyA.isStatic ? bodyA : bodyB, movingBody = sleepingBody === bodyA ? bodyB : bodyA;
                      if (!sleepingBody.isStatic && movingBody.motion > motionSleepThreshold) {
                        Sleeping.set(sleepingBody, false);
                      }
                    }
                  }
                };
                Sleeping.set = function(body, isSleeping) {
                  var wasSleeping = body.isSleeping;
                  if (isSleeping) {
                    body.isSleeping = true;
                    body.sleepCounter = body.sleepThreshold;
                    body.positionImpulse.x = 0;
                    body.positionImpulse.y = 0;
                    body.positionPrev.x = body.position.x;
                    body.positionPrev.y = body.position.y;
                    body.anglePrev = body.angle;
                    body.speed = 0;
                    body.angularSpeed = 0;
                    body.motion = 0;
                    if (!wasSleeping) {
                      Events.trigger(body, "sleepStart");
                    }
                  } else {
                    body.isSleeping = false;
                    body.sleepCounter = 0;
                    if (wasSleeping) {
                      Events.trigger(body, "sleepEnd");
                    }
                  }
                };
              })();
            }),
            /* 8 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Collision = {};
              module2.exports = Collision;
              var Vertices = __webpack_require__(3);
              var Pair = __webpack_require__(9);
              (function() {
                var _supports = [];
                var _overlapAB = {
                  overlap: 0,
                  axis: null
                };
                var _overlapBA = {
                  overlap: 0,
                  axis: null
                };
                Collision.create = function(bodyA, bodyB) {
                  return {
                    pair: null,
                    collided: false,
                    bodyA,
                    bodyB,
                    parentA: bodyA.parent,
                    parentB: bodyB.parent,
                    depth: 0,
                    normal: { x: 0, y: 0 },
                    tangent: { x: 0, y: 0 },
                    penetration: { x: 0, y: 0 },
                    supports: [null, null],
                    supportCount: 0
                  };
                };
                Collision.collides = function(bodyA, bodyB, pairs) {
                  Collision._overlapAxes(_overlapAB, bodyA.vertices, bodyB.vertices, bodyA.axes);
                  if (_overlapAB.overlap <= 0) {
                    return null;
                  }
                  Collision._overlapAxes(_overlapBA, bodyB.vertices, bodyA.vertices, bodyB.axes);
                  if (_overlapBA.overlap <= 0) {
                    return null;
                  }
                  var pair = pairs && pairs.table[Pair.id(bodyA, bodyB)], collision;
                  if (!pair) {
                    collision = Collision.create(bodyA, bodyB);
                    collision.collided = true;
                    collision.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
                    collision.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
                    collision.parentA = collision.bodyA.parent;
                    collision.parentB = collision.bodyB.parent;
                  } else {
                    collision = pair.collision;
                  }
                  bodyA = collision.bodyA;
                  bodyB = collision.bodyB;
                  var minOverlap;
                  if (_overlapAB.overlap < _overlapBA.overlap) {
                    minOverlap = _overlapAB;
                  } else {
                    minOverlap = _overlapBA;
                  }
                  var normal = collision.normal, tangent = collision.tangent, penetration = collision.penetration, supports = collision.supports, depth = minOverlap.overlap, minAxis = minOverlap.axis, normalX = minAxis.x, normalY = minAxis.y, deltaX = bodyB.position.x - bodyA.position.x, deltaY = bodyB.position.y - bodyA.position.y;
                  if (normalX * deltaX + normalY * deltaY >= 0) {
                    normalX = -normalX;
                    normalY = -normalY;
                  }
                  normal.x = normalX;
                  normal.y = normalY;
                  tangent.x = -normalY;
                  tangent.y = normalX;
                  penetration.x = normalX * depth;
                  penetration.y = normalY * depth;
                  collision.depth = depth;
                  var supportsB = Collision._findSupports(bodyA, bodyB, normal, 1), supportCount = 0;
                  if (Vertices.contains(bodyA.vertices, supportsB[0])) {
                    supports[supportCount++] = supportsB[0];
                  }
                  if (Vertices.contains(bodyA.vertices, supportsB[1])) {
                    supports[supportCount++] = supportsB[1];
                  }
                  if (supportCount < 2) {
                    var supportsA = Collision._findSupports(bodyB, bodyA, normal, -1);
                    if (Vertices.contains(bodyB.vertices, supportsA[0])) {
                      supports[supportCount++] = supportsA[0];
                    }
                    if (supportCount < 2 && Vertices.contains(bodyB.vertices, supportsA[1])) {
                      supports[supportCount++] = supportsA[1];
                    }
                  }
                  if (supportCount === 0) {
                    supports[supportCount++] = supportsB[0];
                  }
                  collision.supportCount = supportCount;
                  return collision;
                };
                Collision._overlapAxes = function(result, verticesA, verticesB, axes) {
                  var verticesALength = verticesA.length, verticesBLength = verticesB.length, verticesAX = verticesA[0].x, verticesAY = verticesA[0].y, verticesBX = verticesB[0].x, verticesBY = verticesB[0].y, axesLength = axes.length, overlapMin = Number.MAX_VALUE, overlapAxisNumber = 0, overlap, overlapAB, overlapBA, dot4, i, j;
                  for (i = 0; i < axesLength; i++) {
                    var axis = axes[i], axisX = axis.x, axisY = axis.y, minA = verticesAX * axisX + verticesAY * axisY, minB = verticesBX * axisX + verticesBY * axisY, maxA = minA, maxB = minB;
                    for (j = 1; j < verticesALength; j += 1) {
                      dot4 = verticesA[j].x * axisX + verticesA[j].y * axisY;
                      if (dot4 > maxA) {
                        maxA = dot4;
                      } else if (dot4 < minA) {
                        minA = dot4;
                      }
                    }
                    for (j = 1; j < verticesBLength; j += 1) {
                      dot4 = verticesB[j].x * axisX + verticesB[j].y * axisY;
                      if (dot4 > maxB) {
                        maxB = dot4;
                      } else if (dot4 < minB) {
                        minB = dot4;
                      }
                    }
                    overlapAB = maxA - minB;
                    overlapBA = maxB - minA;
                    overlap = overlapAB < overlapBA ? overlapAB : overlapBA;
                    if (overlap < overlapMin) {
                      overlapMin = overlap;
                      overlapAxisNumber = i;
                      if (overlap <= 0) {
                        break;
                      }
                    }
                  }
                  result.axis = axes[overlapAxisNumber];
                  result.overlap = overlapMin;
                };
                Collision._findSupports = function(bodyA, bodyB, normal, direction) {
                  var vertices = bodyB.vertices, verticesLength = vertices.length, bodyAPositionX = bodyA.position.x, bodyAPositionY = bodyA.position.y, normalX = normal.x * direction, normalY = normal.y * direction, vertexA = vertices[0], vertexB = vertexA, nearestDistance = normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y), vertexC, distance2, j;
                  for (j = 1; j < verticesLength; j += 1) {
                    vertexB = vertices[j];
                    distance2 = normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y);
                    if (distance2 < nearestDistance) {
                      nearestDistance = distance2;
                      vertexA = vertexB;
                    }
                  }
                  vertexC = vertices[(verticesLength + vertexA.index - 1) % verticesLength];
                  nearestDistance = normalX * (bodyAPositionX - vertexC.x) + normalY * (bodyAPositionY - vertexC.y);
                  vertexB = vertices[(vertexA.index + 1) % verticesLength];
                  if (normalX * (bodyAPositionX - vertexB.x) + normalY * (bodyAPositionY - vertexB.y) < nearestDistance) {
                    _supports[0] = vertexA;
                    _supports[1] = vertexB;
                    return _supports;
                  }
                  _supports[0] = vertexA;
                  _supports[1] = vertexC;
                  return _supports;
                };
              })();
            }),
            /* 9 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Pair = {};
              module2.exports = Pair;
              var Contact = __webpack_require__(16);
              (function() {
                Pair.create = function(collision, timestamp) {
                  var bodyA = collision.bodyA, bodyB = collision.bodyB;
                  var pair = {
                    id: Pair.id(bodyA, bodyB),
                    bodyA,
                    bodyB,
                    collision,
                    contacts: [Contact.create(), Contact.create()],
                    contactCount: 0,
                    separation: 0,
                    isActive: true,
                    isSensor: bodyA.isSensor || bodyB.isSensor,
                    timeCreated: timestamp,
                    timeUpdated: timestamp,
                    inverseMass: 0,
                    friction: 0,
                    frictionStatic: 0,
                    restitution: 0,
                    slop: 0
                  };
                  Pair.update(pair, collision, timestamp);
                  return pair;
                };
                Pair.update = function(pair, collision, timestamp) {
                  var supports = collision.supports, supportCount = collision.supportCount, contacts = pair.contacts, parentA = collision.parentA, parentB = collision.parentB;
                  pair.isActive = true;
                  pair.timeUpdated = timestamp;
                  pair.collision = collision;
                  pair.separation = collision.depth;
                  pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
                  pair.friction = parentA.friction < parentB.friction ? parentA.friction : parentB.friction;
                  pair.frictionStatic = parentA.frictionStatic > parentB.frictionStatic ? parentA.frictionStatic : parentB.frictionStatic;
                  pair.restitution = parentA.restitution > parentB.restitution ? parentA.restitution : parentB.restitution;
                  pair.slop = parentA.slop > parentB.slop ? parentA.slop : parentB.slop;
                  pair.contactCount = supportCount;
                  collision.pair = pair;
                  var supportA = supports[0], contactA = contacts[0], supportB = supports[1], contactB = contacts[1];
                  if (contactB.vertex === supportA || contactA.vertex === supportB) {
                    contacts[1] = contactA;
                    contacts[0] = contactA = contactB;
                    contactB = contacts[1];
                  }
                  contactA.vertex = supportA;
                  contactB.vertex = supportB;
                };
                Pair.setActive = function(pair, isActive, timestamp) {
                  if (isActive) {
                    pair.isActive = true;
                    pair.timeUpdated = timestamp;
                  } else {
                    pair.isActive = false;
                    pair.contactCount = 0;
                  }
                };
                Pair.id = function(bodyA, bodyB) {
                  return bodyA.id < bodyB.id ? bodyA.id.toString(36) + ":" + bodyB.id.toString(36) : bodyB.id.toString(36) + ":" + bodyA.id.toString(36);
                };
              })();
            }),
            /* 10 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Constraint = {};
              module2.exports = Constraint;
              var Vertices = __webpack_require__(3);
              var Vector = __webpack_require__(2);
              var Sleeping = __webpack_require__(7);
              var Bounds = __webpack_require__(1);
              var Axes = __webpack_require__(11);
              var Common = __webpack_require__(0);
              (function() {
                Constraint._warming = 0.4;
                Constraint._torqueDampen = 1;
                Constraint._minLength = 1e-6;
                Constraint.create = function(options) {
                  var constraint = options;
                  if (constraint.bodyA && !constraint.pointA)
                    constraint.pointA = { x: 0, y: 0 };
                  if (constraint.bodyB && !constraint.pointB)
                    constraint.pointB = { x: 0, y: 0 };
                  var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA, initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB, length3 = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
                  constraint.length = typeof constraint.length !== "undefined" ? constraint.length : length3;
                  constraint.id = constraint.id || Common.nextId();
                  constraint.label = constraint.label || "Constraint";
                  constraint.type = "constraint";
                  constraint.stiffness = constraint.stiffness || (constraint.length > 0 ? 1 : 0.7);
                  constraint.damping = constraint.damping || 0;
                  constraint.angularStiffness = constraint.angularStiffness || 0;
                  constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
                  constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
                  constraint.plugin = {};
                  var render = {
                    visible: true,
                    lineWidth: 2,
                    strokeStyle: "#ffffff",
                    type: "line",
                    anchors: true
                  };
                  if (constraint.length === 0 && constraint.stiffness > 0.1) {
                    render.type = "pin";
                    render.anchors = false;
                  } else if (constraint.stiffness < 0.9) {
                    render.type = "spring";
                  }
                  constraint.render = Common.extend(render, constraint.render);
                  return constraint;
                };
                Constraint.preSolveAll = function(bodies) {
                  for (var i = 0; i < bodies.length; i += 1) {
                    var body = bodies[i], impulse = body.constraintImpulse;
                    if (body.isStatic || impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                      continue;
                    }
                    body.position.x += impulse.x;
                    body.position.y += impulse.y;
                    body.angle += impulse.angle;
                  }
                };
                Constraint.solveAll = function(constraints, delta) {
                  var timeScale = Common.clamp(delta / Common._baseDelta, 0, 1);
                  for (var i = 0; i < constraints.length; i += 1) {
                    var constraint = constraints[i], fixedA = !constraint.bodyA || constraint.bodyA && constraint.bodyA.isStatic, fixedB = !constraint.bodyB || constraint.bodyB && constraint.bodyB.isStatic;
                    if (fixedA || fixedB) {
                      Constraint.solve(constraints[i], timeScale);
                    }
                  }
                  for (i = 0; i < constraints.length; i += 1) {
                    constraint = constraints[i];
                    fixedA = !constraint.bodyA || constraint.bodyA && constraint.bodyA.isStatic;
                    fixedB = !constraint.bodyB || constraint.bodyB && constraint.bodyB.isStatic;
                    if (!fixedA && !fixedB) {
                      Constraint.solve(constraints[i], timeScale);
                    }
                  }
                };
                Constraint.solve = function(constraint, timeScale) {
                  var bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB;
                  if (!bodyA && !bodyB)
                    return;
                  if (bodyA && !bodyA.isStatic) {
                    Vector.rotate(pointA, bodyA.angle - constraint.angleA, pointA);
                    constraint.angleA = bodyA.angle;
                  }
                  if (bodyB && !bodyB.isStatic) {
                    Vector.rotate(pointB, bodyB.angle - constraint.angleB, pointB);
                    constraint.angleB = bodyB.angle;
                  }
                  var pointAWorld = pointA, pointBWorld = pointB;
                  if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
                  if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);
                  if (!pointAWorld || !pointBWorld)
                    return;
                  var delta = Vector.sub(pointAWorld, pointBWorld), currentLength = Vector.magnitude(delta);
                  if (currentLength < Constraint._minLength) {
                    currentLength = Constraint._minLength;
                  }
                  var difference = (currentLength - constraint.length) / currentLength, isRigid = constraint.stiffness >= 1 || constraint.length === 0, stiffness = isRigid ? constraint.stiffness * timeScale : constraint.stiffness * timeScale * timeScale, damping = constraint.damping * timeScale, force = Vector.mult(delta, difference * stiffness), massTotal = (bodyA ? bodyA.inverseMass : 0) + (bodyB ? bodyB.inverseMass : 0), inertiaTotal = (bodyA ? bodyA.inverseInertia : 0) + (bodyB ? bodyB.inverseInertia : 0), resistanceTotal = massTotal + inertiaTotal, torque, share, normal, normalVelocity, relativeVelocity;
                  if (damping > 0) {
                    var zero = Vector.create();
                    normal = Vector.div(delta, currentLength);
                    relativeVelocity = Vector.sub(
                      bodyB && Vector.sub(bodyB.position, bodyB.positionPrev) || zero,
                      bodyA && Vector.sub(bodyA.position, bodyA.positionPrev) || zero
                    );
                    normalVelocity = Vector.dot(normal, relativeVelocity);
                  }
                  if (bodyA && !bodyA.isStatic) {
                    share = bodyA.inverseMass / massTotal;
                    bodyA.constraintImpulse.x -= force.x * share;
                    bodyA.constraintImpulse.y -= force.y * share;
                    bodyA.position.x -= force.x * share;
                    bodyA.position.y -= force.y * share;
                    if (damping > 0) {
                      bodyA.positionPrev.x -= damping * normal.x * normalVelocity * share;
                      bodyA.positionPrev.y -= damping * normal.y * normalVelocity * share;
                    }
                    torque = Vector.cross(pointA, force) / resistanceTotal * Constraint._torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
                    bodyA.constraintImpulse.angle -= torque;
                    bodyA.angle -= torque;
                  }
                  if (bodyB && !bodyB.isStatic) {
                    share = bodyB.inverseMass / massTotal;
                    bodyB.constraintImpulse.x += force.x * share;
                    bodyB.constraintImpulse.y += force.y * share;
                    bodyB.position.x += force.x * share;
                    bodyB.position.y += force.y * share;
                    if (damping > 0) {
                      bodyB.positionPrev.x += damping * normal.x * normalVelocity * share;
                      bodyB.positionPrev.y += damping * normal.y * normalVelocity * share;
                    }
                    torque = Vector.cross(pointB, force) / resistanceTotal * Constraint._torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
                    bodyB.constraintImpulse.angle += torque;
                    bodyB.angle += torque;
                  }
                };
                Constraint.postSolveAll = function(bodies) {
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], impulse = body.constraintImpulse;
                    if (body.isStatic || impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                      continue;
                    }
                    Sleeping.set(body, false);
                    for (var j = 0; j < body.parts.length; j++) {
                      var part = body.parts[j];
                      Vertices.translate(part.vertices, impulse);
                      if (j > 0) {
                        part.position.x += impulse.x;
                        part.position.y += impulse.y;
                      }
                      if (impulse.angle !== 0) {
                        Vertices.rotate(part.vertices, impulse.angle, body.position);
                        Axes.rotate(part.axes, impulse.angle);
                        if (j > 0) {
                          Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
                        }
                      }
                      Bounds.update(part.bounds, part.vertices, body.velocity);
                    }
                    impulse.angle *= Constraint._warming;
                    impulse.x *= Constraint._warming;
                    impulse.y *= Constraint._warming;
                  }
                };
                Constraint.pointAWorld = function(constraint) {
                  return {
                    x: (constraint.bodyA ? constraint.bodyA.position.x : 0) + (constraint.pointA ? constraint.pointA.x : 0),
                    y: (constraint.bodyA ? constraint.bodyA.position.y : 0) + (constraint.pointA ? constraint.pointA.y : 0)
                  };
                };
                Constraint.pointBWorld = function(constraint) {
                  return {
                    x: (constraint.bodyB ? constraint.bodyB.position.x : 0) + (constraint.pointB ? constraint.pointB.x : 0),
                    y: (constraint.bodyB ? constraint.bodyB.position.y : 0) + (constraint.pointB ? constraint.pointB.y : 0)
                  };
                };
                Constraint.currentLength = function(constraint) {
                  var pointAX = (constraint.bodyA ? constraint.bodyA.position.x : 0) + (constraint.pointA ? constraint.pointA.x : 0);
                  var pointAY = (constraint.bodyA ? constraint.bodyA.position.y : 0) + (constraint.pointA ? constraint.pointA.y : 0);
                  var pointBX = (constraint.bodyB ? constraint.bodyB.position.x : 0) + (constraint.pointB ? constraint.pointB.x : 0);
                  var pointBY = (constraint.bodyB ? constraint.bodyB.position.y : 0) + (constraint.pointB ? constraint.pointB.y : 0);
                  var deltaX = pointAX - pointBX;
                  var deltaY = pointAY - pointBY;
                  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                };
              })();
            }),
            /* 11 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Axes = {};
              module2.exports = Axes;
              var Vector = __webpack_require__(2);
              var Common = __webpack_require__(0);
              (function() {
                Axes.fromVertices = function(vertices) {
                  var axes = {};
                  for (var i = 0; i < vertices.length; i++) {
                    var j = (i + 1) % vertices.length, normal = Vector.normalise({
                      x: vertices[j].y - vertices[i].y,
                      y: vertices[i].x - vertices[j].x
                    }), gradient = normal.y === 0 ? Infinity : normal.x / normal.y;
                    gradient = gradient.toFixed(3).toString();
                    axes[gradient] = normal;
                  }
                  return Common.values(axes);
                };
                Axes.rotate = function(axes, angle2) {
                  if (angle2 === 0)
                    return;
                  var cos = Math.cos(angle2), sin = Math.sin(angle2);
                  for (var i = 0; i < axes.length; i++) {
                    var axis = axes[i], xx;
                    xx = axis.x * cos - axis.y * sin;
                    axis.y = axis.x * sin + axis.y * cos;
                    axis.x = xx;
                  }
                };
              })();
            }),
            /* 12 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Bodies = {};
              module2.exports = Bodies;
              var Vertices = __webpack_require__(3);
              var Common = __webpack_require__(0);
              var Body = __webpack_require__(4);
              var Bounds = __webpack_require__(1);
              var Vector = __webpack_require__(2);
              (function() {
                Bodies.rectangle = function(x, y, width, height, options) {
                  options = options || {};
                  var rectangle = {
                    label: "Rectangle Body",
                    position: { x, y },
                    vertices: Vertices.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    rectangle.vertices = Vertices.chamfer(
                      rectangle.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body.create(Common.extend({}, rectangle, options));
                };
                Bodies.trapezoid = function(x, y, width, height, slope, options) {
                  options = options || {};
                  if (slope >= 1) {
                    Common.warn("Bodies.trapezoid: slope parameter must be < 1.");
                  }
                  slope *= 0.5;
                  var roof = (1 - slope * 2) * width;
                  var x1 = width * slope, x2 = x1 + roof, x3 = x2 + x1, verticesPath;
                  if (slope < 0.5) {
                    verticesPath = "L 0 0 L " + x1 + " " + -height + " L " + x2 + " " + -height + " L " + x3 + " 0";
                  } else {
                    verticesPath = "L 0 0 L " + x2 + " " + -height + " L " + x3 + " 0";
                  }
                  var trapezoid = {
                    label: "Trapezoid Body",
                    position: { x, y },
                    vertices: Vertices.fromPath(verticesPath)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    trapezoid.vertices = Vertices.chamfer(
                      trapezoid.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body.create(Common.extend({}, trapezoid, options));
                };
                Bodies.circle = function(x, y, radius, options, maxSides) {
                  options = options || {};
                  var circle = {
                    label: "Circle Body",
                    circleRadius: radius
                  };
                  maxSides = maxSides || 25;
                  var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));
                  if (sides % 2 === 1)
                    sides += 1;
                  return Bodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
                };
                Bodies.polygon = function(x, y, sides, radius, options) {
                  options = options || {};
                  if (sides < 3)
                    return Bodies.circle(x, y, radius, options);
                  var theta = 2 * Math.PI / sides, path = "", offset = theta * 0.5;
                  for (var i = 0; i < sides; i += 1) {
                    var angle2 = offset + i * theta, xx = Math.cos(angle2) * radius, yy = Math.sin(angle2) * radius;
                    path += "L " + xx.toFixed(3) + " " + yy.toFixed(3) + " ";
                  }
                  var polygon = {
                    label: "Polygon Body",
                    position: { x, y },
                    vertices: Vertices.fromPath(path)
                  };
                  if (options.chamfer) {
                    var chamfer = options.chamfer;
                    polygon.vertices = Vertices.chamfer(
                      polygon.vertices,
                      chamfer.radius,
                      chamfer.quality,
                      chamfer.qualityMin,
                      chamfer.qualityMax
                    );
                    delete options.chamfer;
                  }
                  return Body.create(Common.extend({}, polygon, options));
                };
                Bodies.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea, removeDuplicatePoints) {
                  var decomp = Common.getDecomp(), canDecomp, body, parts, isConvex, isConcave, vertices, i, j, k, v, z;
                  canDecomp = Boolean(decomp && decomp.quickDecomp);
                  options = options || {};
                  parts = [];
                  flagInternal = typeof flagInternal !== "undefined" ? flagInternal : false;
                  removeCollinear = typeof removeCollinear !== "undefined" ? removeCollinear : 0.01;
                  minimumArea = typeof minimumArea !== "undefined" ? minimumArea : 10;
                  removeDuplicatePoints = typeof removeDuplicatePoints !== "undefined" ? removeDuplicatePoints : 0.01;
                  if (!Common.isArray(vertexSets[0])) {
                    vertexSets = [vertexSets];
                  }
                  for (v = 0; v < vertexSets.length; v += 1) {
                    vertices = vertexSets[v];
                    isConvex = Vertices.isConvex(vertices);
                    isConcave = !isConvex;
                    if (isConcave && !canDecomp) {
                      Common.warnOnce(
                        "Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices."
                      );
                    }
                    if (isConvex || !canDecomp) {
                      if (isConvex) {
                        vertices = Vertices.clockwiseSort(vertices);
                      } else {
                        vertices = Vertices.hull(vertices);
                      }
                      parts.push({
                        position: { x, y },
                        vertices
                      });
                    } else {
                      var concave = vertices.map(function(vertex) {
                        return [vertex.x, vertex.y];
                      });
                      decomp.makeCCW(concave);
                      if (removeCollinear !== false)
                        decomp.removeCollinearPoints(concave, removeCollinear);
                      if (removeDuplicatePoints !== false && decomp.removeDuplicatePoints)
                        decomp.removeDuplicatePoints(concave, removeDuplicatePoints);
                      var decomposed = decomp.quickDecomp(concave);
                      for (i = 0; i < decomposed.length; i++) {
                        var chunk = decomposed[i];
                        var chunkVertices = chunk.map(function(vertices2) {
                          return {
                            x: vertices2[0],
                            y: vertices2[1]
                          };
                        });
                        if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
                          continue;
                        parts.push({
                          position: Vertices.centre(chunkVertices),
                          vertices: chunkVertices
                        });
                      }
                    }
                  }
                  for (i = 0; i < parts.length; i++) {
                    parts[i] = Body.create(Common.extend(parts[i], options));
                  }
                  if (flagInternal) {
                    var coincident_max_dist = 5;
                    for (i = 0; i < parts.length; i++) {
                      var partA = parts[i];
                      for (j = i + 1; j < parts.length; j++) {
                        var partB = parts[j];
                        if (Bounds.overlaps(partA.bounds, partB.bounds)) {
                          var pav = partA.vertices, pbv = partB.vertices;
                          for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                              var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])), db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));
                              if (da < coincident_max_dist && db < coincident_max_dist) {
                                pav[k].isInternal = true;
                                pbv[z].isInternal = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  if (parts.length > 1) {
                    body = Body.create(Common.extend({ parts: parts.slice(0) }, options));
                    Body.setPosition(body, { x, y });
                    return body;
                  } else {
                    return parts[0];
                  }
                };
              })();
            }),
            /* 13 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Detector = {};
              module2.exports = Detector;
              var Common = __webpack_require__(0);
              var Collision = __webpack_require__(8);
              (function() {
                Detector.create = function(options) {
                  var defaults = {
                    bodies: [],
                    collisions: [],
                    pairs: null
                  };
                  return Common.extend(defaults, options);
                };
                Detector.setBodies = function(detector, bodies) {
                  detector.bodies = bodies.slice(0);
                };
                Detector.clear = function(detector) {
                  detector.bodies = [];
                  detector.collisions = [];
                };
                Detector.collisions = function(detector) {
                  var pairs = detector.pairs, bodies = detector.bodies, bodiesLength = bodies.length, canCollide = Detector.canCollide, collides = Collision.collides, collisions = detector.collisions, collisionIndex = 0, i, j;
                  bodies.sort(Detector._compareBoundsX);
                  for (i = 0; i < bodiesLength; i++) {
                    var bodyA = bodies[i], boundsA = bodyA.bounds, boundXMax = bodyA.bounds.max.x, boundYMax = bodyA.bounds.max.y, boundYMin = bodyA.bounds.min.y, bodyAStatic = bodyA.isStatic || bodyA.isSleeping, partsALength = bodyA.parts.length, partsASingle = partsALength === 1;
                    for (j = i + 1; j < bodiesLength; j++) {
                      var bodyB = bodies[j], boundsB = bodyB.bounds;
                      if (boundsB.min.x > boundXMax) {
                        break;
                      }
                      if (boundYMax < boundsB.min.y || boundYMin > boundsB.max.y) {
                        continue;
                      }
                      if (bodyAStatic && (bodyB.isStatic || bodyB.isSleeping)) {
                        continue;
                      }
                      if (!canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) {
                        continue;
                      }
                      var partsBLength = bodyB.parts.length;
                      if (partsASingle && partsBLength === 1) {
                        var collision = collides(bodyA, bodyB, pairs);
                        if (collision) {
                          collisions[collisionIndex++] = collision;
                        }
                      } else {
                        var partsAStart = partsALength > 1 ? 1 : 0, partsBStart = partsBLength > 1 ? 1 : 0;
                        for (var k = partsAStart; k < partsALength; k++) {
                          var partA = bodyA.parts[k], boundsA = partA.bounds;
                          for (var z = partsBStart; z < partsBLength; z++) {
                            var partB = bodyB.parts[z], boundsB = partB.bounds;
                            if (boundsA.min.x > boundsB.max.x || boundsA.max.x < boundsB.min.x || boundsA.max.y < boundsB.min.y || boundsA.min.y > boundsB.max.y) {
                              continue;
                            }
                            var collision = collides(partA, partB, pairs);
                            if (collision) {
                              collisions[collisionIndex++] = collision;
                            }
                          }
                        }
                      }
                    }
                  }
                  if (collisions.length !== collisionIndex) {
                    collisions.length = collisionIndex;
                  }
                  return collisions;
                };
                Detector.canCollide = function(filterA, filterB) {
                  if (filterA.group === filterB.group && filterA.group !== 0)
                    return filterA.group > 0;
                  return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
                };
                Detector._compareBoundsX = function(bodyA, bodyB) {
                  return bodyA.bounds.min.x - bodyB.bounds.min.x;
                };
              })();
            }),
            /* 14 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Mouse = {};
              module2.exports = Mouse;
              var Common = __webpack_require__(0);
              (function() {
                Mouse.create = function(element) {
                  var mouse = {};
                  if (!element) {
                    Common.log("Mouse.create: element was undefined, defaulting to document.body", "warn");
                  }
                  mouse.element = element || document.body;
                  mouse.absolute = { x: 0, y: 0 };
                  mouse.position = { x: 0, y: 0 };
                  mouse.mousedownPosition = { x: 0, y: 0 };
                  mouse.mouseupPosition = { x: 0, y: 0 };
                  mouse.offset = { x: 0, y: 0 };
                  mouse.scale = { x: 1, y: 1 };
                  mouse.wheelDelta = 0;
                  mouse.button = -1;
                  mouse.pixelRatio = parseInt(mouse.element.getAttribute("data-pixel-ratio"), 10) || 1;
                  mouse.sourceEvents = {
                    mousemove: null,
                    mousedown: null,
                    mouseup: null,
                    mousewheel: null
                  };
                  mouse.mousemove = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse.button = 0;
                      event.preventDefault();
                    }
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.sourceEvents.mousemove = event;
                  };
                  mouse.mousedown = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      mouse.button = 0;
                      event.preventDefault();
                    } else {
                      mouse.button = event.button;
                    }
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.mousedownPosition.x = mouse.position.x;
                    mouse.mousedownPosition.y = mouse.position.y;
                    mouse.sourceEvents.mousedown = event;
                  };
                  mouse.mouseup = function(event) {
                    var position = Mouse._getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
                    if (touches) {
                      event.preventDefault();
                    }
                    mouse.button = -1;
                    mouse.absolute.x = position.x;
                    mouse.absolute.y = position.y;
                    mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                    mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                    mouse.mouseupPosition.x = mouse.position.x;
                    mouse.mouseupPosition.y = mouse.position.y;
                    mouse.sourceEvents.mouseup = event;
                  };
                  mouse.mousewheel = function(event) {
                    mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
                    event.preventDefault();
                    mouse.sourceEvents.mousewheel = event;
                  };
                  Mouse.setElement(mouse, mouse.element);
                  return mouse;
                };
                Mouse.setElement = function(mouse, element) {
                  mouse.element = element;
                  element.addEventListener("mousemove", mouse.mousemove, { passive: true });
                  element.addEventListener("mousedown", mouse.mousedown, { passive: true });
                  element.addEventListener("mouseup", mouse.mouseup, { passive: true });
                  element.addEventListener("wheel", mouse.mousewheel, { passive: false });
                  element.addEventListener("touchmove", mouse.mousemove, { passive: false });
                  element.addEventListener("touchstart", mouse.mousedown, { passive: false });
                  element.addEventListener("touchend", mouse.mouseup, { passive: false });
                };
                Mouse.clearSourceEvents = function(mouse) {
                  mouse.sourceEvents.mousemove = null;
                  mouse.sourceEvents.mousedown = null;
                  mouse.sourceEvents.mouseup = null;
                  mouse.sourceEvents.mousewheel = null;
                  mouse.wheelDelta = 0;
                };
                Mouse.setOffset = function(mouse, offset) {
                  mouse.offset.x = offset.x;
                  mouse.offset.y = offset.y;
                  mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                  mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                };
                Mouse.setScale = function(mouse, scale5) {
                  mouse.scale.x = scale5.x;
                  mouse.scale.y = scale5.y;
                  mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
                  mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
                };
                Mouse._getRelativeMousePosition = function(event, element, pixelRatio) {
                  var elementBounds = element.getBoundingClientRect(), rootNode = document.documentElement || document.body.parentNode || document.body, scrollX = window.pageXOffset !== void 0 ? window.pageXOffset : rootNode.scrollLeft, scrollY = window.pageYOffset !== void 0 ? window.pageYOffset : rootNode.scrollTop, touches = event.changedTouches, x, y;
                  if (touches) {
                    x = touches[0].pageX - elementBounds.left - scrollX;
                    y = touches[0].pageY - elementBounds.top - scrollY;
                  } else {
                    x = event.pageX - elementBounds.left - scrollX;
                    y = event.pageY - elementBounds.top - scrollY;
                  }
                  return {
                    x: x / (element.clientWidth / (element.width || element.clientWidth) * pixelRatio),
                    y: y / (element.clientHeight / (element.height || element.clientHeight) * pixelRatio)
                  };
                };
              })();
            }),
            /* 15 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Plugin = {};
              module2.exports = Plugin;
              var Common = __webpack_require__(0);
              (function() {
                Plugin._registry = {};
                Plugin.register = function(plugin) {
                  if (!Plugin.isPlugin(plugin)) {
                    Common.warn("Plugin.register:", Plugin.toString(plugin), "does not implement all required fields.");
                  }
                  if (plugin.name in Plugin._registry) {
                    var registered = Plugin._registry[plugin.name], pluginVersion = Plugin.versionParse(plugin.version).number, registeredVersion = Plugin.versionParse(registered.version).number;
                    if (pluginVersion > registeredVersion) {
                      Common.warn("Plugin.register:", Plugin.toString(registered), "was upgraded to", Plugin.toString(plugin));
                      Plugin._registry[plugin.name] = plugin;
                    } else if (pluginVersion < registeredVersion) {
                      Common.warn("Plugin.register:", Plugin.toString(registered), "can not be downgraded to", Plugin.toString(plugin));
                    } else if (plugin !== registered) {
                      Common.warn("Plugin.register:", Plugin.toString(plugin), "is already registered to different plugin object");
                    }
                  } else {
                    Plugin._registry[plugin.name] = plugin;
                  }
                  return plugin;
                };
                Plugin.resolve = function(dependency) {
                  return Plugin._registry[Plugin.dependencyParse(dependency).name];
                };
                Plugin.toString = function(plugin) {
                  return typeof plugin === "string" ? plugin : (plugin.name || "anonymous") + "@" + (plugin.version || plugin.range || "0.0.0");
                };
                Plugin.isPlugin = function(obj) {
                  return obj && obj.name && obj.version && obj.install;
                };
                Plugin.isUsed = function(module3, name) {
                  return module3.used.indexOf(name) > -1;
                };
                Plugin.isFor = function(plugin, module3) {
                  var parsed = plugin.for && Plugin.dependencyParse(plugin.for);
                  return !plugin.for || module3.name === parsed.name && Plugin.versionSatisfies(module3.version, parsed.range);
                };
                Plugin.use = function(module3, plugins) {
                  module3.uses = (module3.uses || []).concat(plugins || []);
                  if (module3.uses.length === 0) {
                    Common.warn("Plugin.use:", Plugin.toString(module3), "does not specify any dependencies to install.");
                    return;
                  }
                  var dependencies = Plugin.dependencies(module3), sortedDependencies = Common.topologicalSort(dependencies), status = [];
                  for (var i = 0; i < sortedDependencies.length; i += 1) {
                    if (sortedDependencies[i] === module3.name) {
                      continue;
                    }
                    var plugin = Plugin.resolve(sortedDependencies[i]);
                    if (!plugin) {
                      status.push("\u274C " + sortedDependencies[i]);
                      continue;
                    }
                    if (Plugin.isUsed(module3, plugin.name)) {
                      continue;
                    }
                    if (!Plugin.isFor(plugin, module3)) {
                      Common.warn("Plugin.use:", Plugin.toString(plugin), "is for", plugin.for, "but installed on", Plugin.toString(module3) + ".");
                      plugin._warned = true;
                    }
                    if (plugin.install) {
                      plugin.install(module3);
                    } else {
                      Common.warn("Plugin.use:", Plugin.toString(plugin), "does not specify an install function.");
                      plugin._warned = true;
                    }
                    if (plugin._warned) {
                      status.push("\u{1F536} " + Plugin.toString(plugin));
                      delete plugin._warned;
                    } else {
                      status.push("\u2705 " + Plugin.toString(plugin));
                    }
                    module3.used.push(plugin.name);
                  }
                  if (status.length > 0) {
                    Common.info(status.join("  "));
                  }
                };
                Plugin.dependencies = function(module3, tracked) {
                  var parsedBase = Plugin.dependencyParse(module3), name = parsedBase.name;
                  tracked = tracked || {};
                  if (name in tracked) {
                    return;
                  }
                  module3 = Plugin.resolve(module3) || module3;
                  tracked[name] = Common.map(module3.uses || [], function(dependency) {
                    if (Plugin.isPlugin(dependency)) {
                      Plugin.register(dependency);
                    }
                    var parsed = Plugin.dependencyParse(dependency), resolved = Plugin.resolve(dependency);
                    if (resolved && !Plugin.versionSatisfies(resolved.version, parsed.range)) {
                      Common.warn(
                        "Plugin.dependencies:",
                        Plugin.toString(resolved),
                        "does not satisfy",
                        Plugin.toString(parsed),
                        "used by",
                        Plugin.toString(parsedBase) + "."
                      );
                      resolved._warned = true;
                      module3._warned = true;
                    } else if (!resolved) {
                      Common.warn(
                        "Plugin.dependencies:",
                        Plugin.toString(dependency),
                        "used by",
                        Plugin.toString(parsedBase),
                        "could not be resolved."
                      );
                      module3._warned = true;
                    }
                    return parsed.name;
                  });
                  for (var i = 0; i < tracked[name].length; i += 1) {
                    Plugin.dependencies(tracked[name][i], tracked);
                  }
                  return tracked;
                };
                Plugin.dependencyParse = function(dependency) {
                  if (Common.isString(dependency)) {
                    var pattern = /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/;
                    if (!pattern.test(dependency)) {
                      Common.warn("Plugin.dependencyParse:", dependency, "is not a valid dependency string.");
                    }
                    return {
                      name: dependency.split("@")[0],
                      range: dependency.split("@")[1] || "*"
                    };
                  }
                  return {
                    name: dependency.name,
                    range: dependency.range || dependency.version
                  };
                };
                Plugin.versionParse = function(range) {
                  var pattern = /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;
                  if (!pattern.test(range)) {
                    Common.warn("Plugin.versionParse:", range, "is not a valid version or range.");
                  }
                  var parts = pattern.exec(range);
                  var major = Number(parts[4]);
                  var minor = Number(parts[5]);
                  var patch = Number(parts[6]);
                  return {
                    isRange: Boolean(parts[1] || parts[2]),
                    version: parts[3],
                    range,
                    operator: parts[1] || parts[2] || "",
                    major,
                    minor,
                    patch,
                    parts: [major, minor, patch],
                    prerelease: parts[7],
                    number: major * 1e8 + minor * 1e4 + patch
                  };
                };
                Plugin.versionSatisfies = function(version, range) {
                  range = range || "*";
                  var r = Plugin.versionParse(range), v = Plugin.versionParse(version);
                  if (r.isRange) {
                    if (r.operator === "*" || version === "*") {
                      return true;
                    }
                    if (r.operator === ">") {
                      return v.number > r.number;
                    }
                    if (r.operator === ">=") {
                      return v.number >= r.number;
                    }
                    if (r.operator === "~") {
                      return v.major === r.major && v.minor === r.minor && v.patch >= r.patch;
                    }
                    if (r.operator === "^") {
                      if (r.major > 0) {
                        return v.major === r.major && v.number >= r.number;
                      }
                      if (r.minor > 0) {
                        return v.minor === r.minor && v.patch >= r.patch;
                      }
                      return v.patch === r.patch;
                    }
                  }
                  return version === range || version === "*";
                };
              })();
            }),
            /* 16 */
            /***/
            (function(module2, exports2) {
              var Contact = {};
              module2.exports = Contact;
              (function() {
                Contact.create = function(vertex) {
                  return {
                    vertex,
                    normalImpulse: 0,
                    tangentImpulse: 0
                  };
                };
              })();
            }),
            /* 17 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Engine = {};
              module2.exports = Engine;
              var Sleeping = __webpack_require__(7);
              var Resolver = __webpack_require__(18);
              var Detector = __webpack_require__(13);
              var Pairs = __webpack_require__(19);
              var Events = __webpack_require__(5);
              var Composite = __webpack_require__(6);
              var Constraint = __webpack_require__(10);
              var Common = __webpack_require__(0);
              var Body = __webpack_require__(4);
              (function() {
                Engine._deltaMax = 1e3 / 60;
                Engine.create = function(options) {
                  options = options || {};
                  var defaults = {
                    positionIterations: 6,
                    velocityIterations: 4,
                    constraintIterations: 2,
                    enableSleeping: false,
                    events: [],
                    plugin: {},
                    gravity: {
                      x: 0,
                      y: 1,
                      scale: 1e-3
                    },
                    timing: {
                      timestamp: 0,
                      timeScale: 1,
                      lastDelta: 0,
                      lastElapsed: 0,
                      lastUpdatesPerFrame: 0
                    }
                  };
                  var engine = Common.extend(defaults, options);
                  engine.world = options.world || Composite.create({ label: "World" });
                  engine.pairs = options.pairs || Pairs.create();
                  engine.detector = options.detector || Detector.create();
                  engine.detector.pairs = engine.pairs;
                  engine.grid = { buckets: [] };
                  engine.world.gravity = engine.gravity;
                  engine.broadphase = engine.grid;
                  engine.metrics = {};
                  return engine;
                };
                Engine.update = function(engine, delta) {
                  var startTime = Common.now();
                  var world = engine.world, detector = engine.detector, pairs = engine.pairs, timing = engine.timing, timestamp = timing.timestamp, i;
                  if (delta > Engine._deltaMax) {
                    Common.warnOnce(
                      "Matter.Engine.update: delta argument is recommended to be less than or equal to",
                      Engine._deltaMax.toFixed(3),
                      "ms."
                    );
                  }
                  delta = typeof delta !== "undefined" ? delta : Common._baseDelta;
                  delta *= timing.timeScale;
                  timing.timestamp += delta;
                  timing.lastDelta = delta;
                  var event = {
                    timestamp: timing.timestamp,
                    delta
                  };
                  Events.trigger(engine, "beforeUpdate", event);
                  var allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world);
                  if (world.isModified) {
                    Detector.setBodies(detector, allBodies);
                    Composite.setModified(world, false, false, true);
                  }
                  if (engine.enableSleeping)
                    Sleeping.update(allBodies, delta);
                  Engine._bodiesApplyGravity(allBodies, engine.gravity);
                  if (delta > 0) {
                    Engine._bodiesUpdate(allBodies, delta);
                  }
                  Events.trigger(engine, "beforeSolve", event);
                  Constraint.preSolveAll(allBodies);
                  for (i = 0; i < engine.constraintIterations; i++) {
                    Constraint.solveAll(allConstraints, delta);
                  }
                  Constraint.postSolveAll(allBodies);
                  var collisions = Detector.collisions(detector);
                  Pairs.update(pairs, collisions, timestamp);
                  if (engine.enableSleeping)
                    Sleeping.afterCollisions(pairs.list);
                  if (pairs.collisionStart.length > 0) {
                    Events.trigger(engine, "collisionStart", {
                      pairs: pairs.collisionStart,
                      timestamp: timing.timestamp,
                      delta
                    });
                  }
                  var positionDamping = Common.clamp(20 / engine.positionIterations, 0, 1);
                  Resolver.preSolvePosition(pairs.list);
                  for (i = 0; i < engine.positionIterations; i++) {
                    Resolver.solvePosition(pairs.list, delta, positionDamping);
                  }
                  Resolver.postSolvePosition(allBodies);
                  Constraint.preSolveAll(allBodies);
                  for (i = 0; i < engine.constraintIterations; i++) {
                    Constraint.solveAll(allConstraints, delta);
                  }
                  Constraint.postSolveAll(allBodies);
                  Resolver.preSolveVelocity(pairs.list);
                  for (i = 0; i < engine.velocityIterations; i++) {
                    Resolver.solveVelocity(pairs.list, delta);
                  }
                  Engine._bodiesUpdateVelocities(allBodies);
                  if (pairs.collisionActive.length > 0) {
                    Events.trigger(engine, "collisionActive", {
                      pairs: pairs.collisionActive,
                      timestamp: timing.timestamp,
                      delta
                    });
                  }
                  if (pairs.collisionEnd.length > 0) {
                    Events.trigger(engine, "collisionEnd", {
                      pairs: pairs.collisionEnd,
                      timestamp: timing.timestamp,
                      delta
                    });
                  }
                  Engine._bodiesClearForces(allBodies);
                  Events.trigger(engine, "afterUpdate", event);
                  engine.timing.lastElapsed = Common.now() - startTime;
                  return engine;
                };
                Engine.merge = function(engineA, engineB) {
                  Common.extend(engineA, engineB);
                  if (engineB.world) {
                    engineA.world = engineB.world;
                    Engine.clear(engineA);
                    var bodies = Composite.allBodies(engineA.world);
                    for (var i = 0; i < bodies.length; i++) {
                      var body = bodies[i];
                      Sleeping.set(body, false);
                      body.id = Common.nextId();
                    }
                  }
                };
                Engine.clear = function(engine) {
                  Pairs.clear(engine.pairs);
                  Detector.clear(engine.detector);
                };
                Engine._bodiesClearForces = function(bodies) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    body.force.x = 0;
                    body.force.y = 0;
                    body.torque = 0;
                  }
                };
                Engine._bodiesApplyGravity = function(bodies, gravity) {
                  var gravityScale = typeof gravity.scale !== "undefined" ? gravity.scale : 1e-3, bodiesLength = bodies.length;
                  if (gravity.x === 0 && gravity.y === 0 || gravityScale === 0) {
                    return;
                  }
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    if (body.isStatic || body.isSleeping)
                      continue;
                    body.force.y += body.mass * gravity.y * gravityScale;
                    body.force.x += body.mass * gravity.x * gravityScale;
                  }
                };
                Engine._bodiesUpdate = function(bodies, delta) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i];
                    if (body.isStatic || body.isSleeping)
                      continue;
                    Body.update(body, delta);
                  }
                };
                Engine._bodiesUpdateVelocities = function(bodies) {
                  var bodiesLength = bodies.length;
                  for (var i = 0; i < bodiesLength; i++) {
                    Body.updateVelocities(bodies[i]);
                  }
                };
              })();
            }),
            /* 18 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Resolver = {};
              module2.exports = Resolver;
              var Vertices = __webpack_require__(3);
              var Common = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              (function() {
                Resolver._restingThresh = 2;
                Resolver._restingThreshTangent = Math.sqrt(6);
                Resolver._positionDampen = 0.9;
                Resolver._positionWarming = 0.8;
                Resolver._frictionNormalMultiplier = 5;
                Resolver._frictionMaxStatic = Number.MAX_VALUE;
                Resolver.preSolvePosition = function(pairs) {
                  var i, pair, contactCount, pairsLength = pairs.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    contactCount = pair.contactCount;
                    pair.collision.parentA.totalContacts += contactCount;
                    pair.collision.parentB.totalContacts += contactCount;
                  }
                };
                Resolver.solvePosition = function(pairs, delta, damping) {
                  var i, pair, collision, bodyA, bodyB, normal, contactShare, positionImpulse, positionDampen = Resolver._positionDampen * (damping || 1), slopDampen = Common.clamp(delta / Common._baseDelta, 0, 1), pairsLength = pairs.length;
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.parentA;
                    bodyB = collision.parentB;
                    normal = collision.normal;
                    pair.separation = collision.depth + normal.x * (bodyB.positionImpulse.x - bodyA.positionImpulse.x) + normal.y * (bodyB.positionImpulse.y - bodyA.positionImpulse.y);
                  }
                  for (i = 0; i < pairsLength; i++) {
                    pair = pairs[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.parentA;
                    bodyB = collision.parentB;
                    normal = collision.normal;
                    positionImpulse = pair.separation - pair.slop * slopDampen;
                    if (bodyA.isStatic || bodyB.isStatic)
                      positionImpulse *= 2;
                    if (!(bodyA.isStatic || bodyA.isSleeping)) {
                      contactShare = positionDampen / bodyA.totalContacts;
                      bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
                      bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
                    }
                    if (!(bodyB.isStatic || bodyB.isSleeping)) {
                      contactShare = positionDampen / bodyB.totalContacts;
                      bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
                      bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
                    }
                  }
                };
                Resolver.postSolvePosition = function(bodies) {
                  var positionWarming = Resolver._positionWarming, bodiesLength = bodies.length, verticesTranslate = Vertices.translate, boundsUpdate = Bounds.update;
                  for (var i = 0; i < bodiesLength; i++) {
                    var body = bodies[i], positionImpulse = body.positionImpulse, positionImpulseX = positionImpulse.x, positionImpulseY = positionImpulse.y, velocity = body.velocity;
                    body.totalContacts = 0;
                    if (positionImpulseX !== 0 || positionImpulseY !== 0) {
                      for (var j = 0; j < body.parts.length; j++) {
                        var part = body.parts[j];
                        verticesTranslate(part.vertices, positionImpulse);
                        boundsUpdate(part.bounds, part.vertices, velocity);
                        part.position.x += positionImpulseX;
                        part.position.y += positionImpulseY;
                      }
                      body.positionPrev.x += positionImpulseX;
                      body.positionPrev.y += positionImpulseY;
                      if (positionImpulseX * velocity.x + positionImpulseY * velocity.y < 0) {
                        positionImpulse.x = 0;
                        positionImpulse.y = 0;
                      } else {
                        positionImpulse.x *= positionWarming;
                        positionImpulse.y *= positionWarming;
                      }
                    }
                  }
                };
                Resolver.preSolveVelocity = function(pairs) {
                  var pairsLength = pairs.length, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    var contacts = pair.contacts, contactCount = pair.contactCount, collision = pair.collision, bodyA = collision.parentA, bodyB = collision.parentB, normal = collision.normal, tangent = collision.tangent;
                    for (j = 0; j < contactCount; j++) {
                      var contact = contacts[j], contactVertex = contact.vertex, normalImpulse = contact.normalImpulse, tangentImpulse = contact.tangentImpulse;
                      if (normalImpulse !== 0 || tangentImpulse !== 0) {
                        var impulseX = normal.x * normalImpulse + tangent.x * tangentImpulse, impulseY = normal.y * normalImpulse + tangent.y * tangentImpulse;
                        if (!(bodyA.isStatic || bodyA.isSleeping)) {
                          bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                          bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                          bodyA.anglePrev += bodyA.inverseInertia * ((contactVertex.x - bodyA.position.x) * impulseY - (contactVertex.y - bodyA.position.y) * impulseX);
                        }
                        if (!(bodyB.isStatic || bodyB.isSleeping)) {
                          bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                          bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                          bodyB.anglePrev -= bodyB.inverseInertia * ((contactVertex.x - bodyB.position.x) * impulseY - (contactVertex.y - bodyB.position.y) * impulseX);
                        }
                      }
                    }
                  }
                };
                Resolver.solveVelocity = function(pairs, delta) {
                  var timeScale = delta / Common._baseDelta, timeScaleSquared = timeScale * timeScale, timeScaleCubed = timeScaleSquared * timeScale, restingThresh = -Resolver._restingThresh * timeScale, restingThreshTangent = Resolver._restingThreshTangent, frictionNormalMultiplier = Resolver._frictionNormalMultiplier * timeScale, frictionMaxStatic = Resolver._frictionMaxStatic, pairsLength = pairs.length, tangentImpulse, maxFriction, i, j;
                  for (i = 0; i < pairsLength; i++) {
                    var pair = pairs[i];
                    if (!pair.isActive || pair.isSensor)
                      continue;
                    var collision = pair.collision, bodyA = collision.parentA, bodyB = collision.parentB, normalX = collision.normal.x, normalY = collision.normal.y, tangentX = collision.tangent.x, tangentY = collision.tangent.y, inverseMassTotal = pair.inverseMass, friction = pair.friction * pair.frictionStatic * frictionNormalMultiplier, contacts = pair.contacts, contactCount = pair.contactCount, contactShare = 1 / contactCount;
                    var bodyAVelocityX = bodyA.position.x - bodyA.positionPrev.x, bodyAVelocityY = bodyA.position.y - bodyA.positionPrev.y, bodyAAngularVelocity = bodyA.angle - bodyA.anglePrev, bodyBVelocityX = bodyB.position.x - bodyB.positionPrev.x, bodyBVelocityY = bodyB.position.y - bodyB.positionPrev.y, bodyBAngularVelocity = bodyB.angle - bodyB.anglePrev;
                    for (j = 0; j < contactCount; j++) {
                      var contact = contacts[j], contactVertex = contact.vertex;
                      var offsetAX = contactVertex.x - bodyA.position.x, offsetAY = contactVertex.y - bodyA.position.y, offsetBX = contactVertex.x - bodyB.position.x, offsetBY = contactVertex.y - bodyB.position.y;
                      var velocityPointAX = bodyAVelocityX - offsetAY * bodyAAngularVelocity, velocityPointAY = bodyAVelocityY + offsetAX * bodyAAngularVelocity, velocityPointBX = bodyBVelocityX - offsetBY * bodyBAngularVelocity, velocityPointBY = bodyBVelocityY + offsetBX * bodyBAngularVelocity;
                      var relativeVelocityX = velocityPointAX - velocityPointBX, relativeVelocityY = velocityPointAY - velocityPointBY;
                      var normalVelocity = normalX * relativeVelocityX + normalY * relativeVelocityY, tangentVelocity = tangentX * relativeVelocityX + tangentY * relativeVelocityY;
                      var normalOverlap = pair.separation + normalVelocity;
                      var normalForce = Math.min(normalOverlap, 1);
                      normalForce = normalOverlap < 0 ? 0 : normalForce;
                      var frictionLimit = normalForce * friction;
                      if (tangentVelocity < -frictionLimit || tangentVelocity > frictionLimit) {
                        maxFriction = tangentVelocity > 0 ? tangentVelocity : -tangentVelocity;
                        tangentImpulse = pair.friction * (tangentVelocity > 0 ? 1 : -1) * timeScaleCubed;
                        if (tangentImpulse < -maxFriction) {
                          tangentImpulse = -maxFriction;
                        } else if (tangentImpulse > maxFriction) {
                          tangentImpulse = maxFriction;
                        }
                      } else {
                        tangentImpulse = tangentVelocity;
                        maxFriction = frictionMaxStatic;
                      }
                      var oAcN = offsetAX * normalY - offsetAY * normalX, oBcN = offsetBX * normalY - offsetBY * normalX, share = contactShare / (inverseMassTotal + bodyA.inverseInertia * oAcN * oAcN + bodyB.inverseInertia * oBcN * oBcN);
                      var normalImpulse = (1 + pair.restitution) * normalVelocity * share;
                      tangentImpulse *= share;
                      if (normalVelocity < restingThresh) {
                        contact.normalImpulse = 0;
                      } else {
                        var contactNormalImpulse = contact.normalImpulse;
                        contact.normalImpulse += normalImpulse;
                        if (contact.normalImpulse > 0) contact.normalImpulse = 0;
                        normalImpulse = contact.normalImpulse - contactNormalImpulse;
                      }
                      if (tangentVelocity < -restingThreshTangent || tangentVelocity > restingThreshTangent) {
                        contact.tangentImpulse = 0;
                      } else {
                        var contactTangentImpulse = contact.tangentImpulse;
                        contact.tangentImpulse += tangentImpulse;
                        if (contact.tangentImpulse < -maxFriction) contact.tangentImpulse = -maxFriction;
                        if (contact.tangentImpulse > maxFriction) contact.tangentImpulse = maxFriction;
                        tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
                      }
                      var impulseX = normalX * normalImpulse + tangentX * tangentImpulse, impulseY = normalY * normalImpulse + tangentY * tangentImpulse;
                      if (!(bodyA.isStatic || bodyA.isSleeping)) {
                        bodyA.positionPrev.x += impulseX * bodyA.inverseMass;
                        bodyA.positionPrev.y += impulseY * bodyA.inverseMass;
                        bodyA.anglePrev += (offsetAX * impulseY - offsetAY * impulseX) * bodyA.inverseInertia;
                      }
                      if (!(bodyB.isStatic || bodyB.isSleeping)) {
                        bodyB.positionPrev.x -= impulseX * bodyB.inverseMass;
                        bodyB.positionPrev.y -= impulseY * bodyB.inverseMass;
                        bodyB.anglePrev -= (offsetBX * impulseY - offsetBY * impulseX) * bodyB.inverseInertia;
                      }
                    }
                  }
                };
              })();
            }),
            /* 19 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Pairs = {};
              module2.exports = Pairs;
              var Pair = __webpack_require__(9);
              var Common = __webpack_require__(0);
              (function() {
                Pairs.create = function(options) {
                  return Common.extend({
                    table: {},
                    list: [],
                    collisionStart: [],
                    collisionActive: [],
                    collisionEnd: []
                  }, options);
                };
                Pairs.update = function(pairs, collisions, timestamp) {
                  var pairUpdate = Pair.update, pairCreate = Pair.create, pairSetActive = Pair.setActive, pairsTable = pairs.table, pairsList = pairs.list, pairsListLength = pairsList.length, pairsListIndex = pairsListLength, collisionStart = pairs.collisionStart, collisionEnd = pairs.collisionEnd, collisionActive = pairs.collisionActive, collisionsLength = collisions.length, collisionStartIndex = 0, collisionEndIndex = 0, collisionActiveIndex = 0, collision, pair, i;
                  for (i = 0; i < collisionsLength; i++) {
                    collision = collisions[i];
                    pair = collision.pair;
                    if (pair) {
                      if (pair.isActive) {
                        collisionActive[collisionActiveIndex++] = pair;
                      }
                      pairUpdate(pair, collision, timestamp);
                    } else {
                      pair = pairCreate(collision, timestamp);
                      pairsTable[pair.id] = pair;
                      collisionStart[collisionStartIndex++] = pair;
                      pairsList[pairsListIndex++] = pair;
                    }
                  }
                  pairsListIndex = 0;
                  pairsListLength = pairsList.length;
                  for (i = 0; i < pairsListLength; i++) {
                    pair = pairsList[i];
                    if (pair.timeUpdated >= timestamp) {
                      pairsList[pairsListIndex++] = pair;
                    } else {
                      pairSetActive(pair, false, timestamp);
                      if (pair.collision.bodyA.sleepCounter > 0 && pair.collision.bodyB.sleepCounter > 0) {
                        pairsList[pairsListIndex++] = pair;
                      } else {
                        collisionEnd[collisionEndIndex++] = pair;
                        delete pairsTable[pair.id];
                      }
                    }
                  }
                  if (pairsList.length !== pairsListIndex) {
                    pairsList.length = pairsListIndex;
                  }
                  if (collisionStart.length !== collisionStartIndex) {
                    collisionStart.length = collisionStartIndex;
                  }
                  if (collisionEnd.length !== collisionEndIndex) {
                    collisionEnd.length = collisionEndIndex;
                  }
                  if (collisionActive.length !== collisionActiveIndex) {
                    collisionActive.length = collisionActiveIndex;
                  }
                };
                Pairs.clear = function(pairs) {
                  pairs.table = {};
                  pairs.list.length = 0;
                  pairs.collisionStart.length = 0;
                  pairs.collisionActive.length = 0;
                  pairs.collisionEnd.length = 0;
                  return pairs;
                };
              })();
            }),
            /* 20 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Matter3 = module2.exports = __webpack_require__(21);
              Matter3.Axes = __webpack_require__(11);
              Matter3.Bodies = __webpack_require__(12);
              Matter3.Body = __webpack_require__(4);
              Matter3.Bounds = __webpack_require__(1);
              Matter3.Collision = __webpack_require__(8);
              Matter3.Common = __webpack_require__(0);
              Matter3.Composite = __webpack_require__(6);
              Matter3.Composites = __webpack_require__(22);
              Matter3.Constraint = __webpack_require__(10);
              Matter3.Contact = __webpack_require__(16);
              Matter3.Detector = __webpack_require__(13);
              Matter3.Engine = __webpack_require__(17);
              Matter3.Events = __webpack_require__(5);
              Matter3.Grid = __webpack_require__(23);
              Matter3.Mouse = __webpack_require__(14);
              Matter3.MouseConstraint = __webpack_require__(24);
              Matter3.Pair = __webpack_require__(9);
              Matter3.Pairs = __webpack_require__(19);
              Matter3.Plugin = __webpack_require__(15);
              Matter3.Query = __webpack_require__(25);
              Matter3.Render = __webpack_require__(26);
              Matter3.Resolver = __webpack_require__(18);
              Matter3.Runner = __webpack_require__(27);
              Matter3.SAT = __webpack_require__(28);
              Matter3.Sleeping = __webpack_require__(7);
              Matter3.Svg = __webpack_require__(29);
              Matter3.Vector = __webpack_require__(2);
              Matter3.Vertices = __webpack_require__(3);
              Matter3.World = __webpack_require__(30);
              Matter3.Engine.run = Matter3.Runner.run;
              Matter3.Common.deprecated(Matter3.Engine, "run", "Engine.run \u27A4 use Matter.Runner.run(engine) instead");
            }),
            /* 21 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Matter3 = {};
              module2.exports = Matter3;
              var Plugin = __webpack_require__(15);
              var Common = __webpack_require__(0);
              (function() {
                Matter3.name = "matter-js";
                Matter3.version = true ? "0.20.0" : void 0;
                Matter3.uses = [];
                Matter3.used = [];
                Matter3.use = function() {
                  Plugin.use(Matter3, Array.prototype.slice.call(arguments));
                };
                Matter3.before = function(path, func) {
                  path = path.replace(/^Matter./, "");
                  return Common.chainPathBefore(Matter3, path, func);
                };
                Matter3.after = function(path, func) {
                  path = path.replace(/^Matter./, "");
                  return Common.chainPathAfter(Matter3, path, func);
                };
              })();
            }),
            /* 22 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Composites = {};
              module2.exports = Composites;
              var Composite = __webpack_require__(6);
              var Constraint = __webpack_require__(10);
              var Common = __webpack_require__(0);
              var Body = __webpack_require__(4);
              var Bodies = __webpack_require__(12);
              var deprecated = Common.deprecated;
              (function() {
                Composites.stack = function(x, y, columns, rows, columnGap, rowGap, callback) {
                  var stack = Composite.create({ label: "Stack" }), currentX = x, currentY = y, lastBody, i = 0;
                  for (var row = 0; row < rows; row++) {
                    var maxHeight = 0;
                    for (var column = 0; column < columns; column++) {
                      var body = callback(currentX, currentY, column, row, lastBody, i);
                      if (body) {
                        var bodyHeight = body.bounds.max.y - body.bounds.min.y, bodyWidth = body.bounds.max.x - body.bounds.min.x;
                        if (bodyHeight > maxHeight)
                          maxHeight = bodyHeight;
                        Body.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });
                        currentX = body.bounds.max.x + columnGap;
                        Composite.addBody(stack, body);
                        lastBody = body;
                        i += 1;
                      } else {
                        currentX += columnGap;
                      }
                    }
                    currentY += maxHeight + rowGap;
                    currentX = x;
                  }
                  return stack;
                };
                Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
                  var bodies = composite.bodies;
                  for (var i = 1; i < bodies.length; i++) {
                    var bodyA = bodies[i - 1], bodyB = bodies[i], bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y, bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y, bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
                    var defaults = {
                      bodyA,
                      pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                      bodyB,
                      pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
                    };
                    var constraint = Common.extend(defaults, options);
                    Composite.addConstraint(composite, Constraint.create(constraint));
                  }
                  composite.label += " Chain";
                  return composite;
                };
                Composites.mesh = function(composite, columns, rows, crossBrace, options) {
                  var bodies = composite.bodies, row, col, bodyA, bodyB, bodyC;
                  for (row = 0; row < rows; row++) {
                    for (col = 1; col < columns; col++) {
                      bodyA = bodies[col - 1 + row * columns];
                      bodyB = bodies[col + row * columns];
                      Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA, bodyB }, options)));
                    }
                    if (row > 0) {
                      for (col = 0; col < columns; col++) {
                        bodyA = bodies[col + (row - 1) * columns];
                        bodyB = bodies[col + row * columns];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA, bodyB }, options)));
                        if (crossBrace && col > 0) {
                          bodyC = bodies[col - 1 + (row - 1) * columns];
                          Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB }, options)));
                        }
                        if (crossBrace && col < columns - 1) {
                          bodyC = bodies[col + 1 + (row - 1) * columns];
                          Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB }, options)));
                        }
                      }
                    }
                  }
                  composite.label += " Mesh";
                  return composite;
                };
                Composites.pyramid = function(x, y, columns, rows, columnGap, rowGap, callback) {
                  return Composites.stack(x, y, columns, rows, columnGap, rowGap, function(stackX, stackY, column, row, lastBody, i) {
                    var actualRows = Math.min(rows, Math.ceil(columns / 2)), lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
                    if (row > actualRows)
                      return;
                    row = actualRows - row;
                    var start = row, end = columns - 1 - row;
                    if (column < start || column > end)
                      return;
                    if (i === 1) {
                      Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
                    }
                    var xOffset = lastBody ? column * lastBodyWidth : 0;
                    return callback(x + xOffset + column * columnGap, stackY, column, row, lastBody, i);
                  });
                };
                Composites.newtonsCradle = function(x, y, number, size, length3) {
                  var newtonsCradle = Composite.create({ label: "Newtons Cradle" });
                  for (var i = 0; i < number; i++) {
                    var separation = 1.9, circle = Bodies.circle(
                      x + i * (size * separation),
                      y + length3,
                      size,
                      { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 1e-4, slop: 1 }
                    ), constraint = Constraint.create({ pointA: { x: x + i * (size * separation), y }, bodyB: circle });
                    Composite.addBody(newtonsCradle, circle);
                    Composite.addConstraint(newtonsCradle, constraint);
                  }
                  return newtonsCradle;
                };
                deprecated(Composites, "newtonsCradle", "Composites.newtonsCradle \u27A4 moved to newtonsCradle example");
                Composites.car = function(x, y, width, height, wheelSize) {
                  var group = Body.nextGroup(true), wheelBase = 20, wheelAOffset = -width * 0.5 + wheelBase, wheelBOffset = width * 0.5 - wheelBase, wheelYOffset = 0;
                  var car = Composite.create({ label: "Car" }), body = Bodies.rectangle(x, y, width, height, {
                    collisionFilter: {
                      group
                    },
                    chamfer: {
                      radius: height * 0.5
                    },
                    density: 2e-4
                  });
                  var wheelA = Bodies.circle(x + wheelAOffset, y + wheelYOffset, wheelSize, {
                    collisionFilter: {
                      group
                    },
                    friction: 0.8
                  });
                  var wheelB = Bodies.circle(x + wheelBOffset, y + wheelYOffset, wheelSize, {
                    collisionFilter: {
                      group
                    },
                    friction: 0.8
                  });
                  var axelA = Constraint.create({
                    bodyB: body,
                    pointB: { x: wheelAOffset, y: wheelYOffset },
                    bodyA: wheelA,
                    stiffness: 1,
                    length: 0
                  });
                  var axelB = Constraint.create({
                    bodyB: body,
                    pointB: { x: wheelBOffset, y: wheelYOffset },
                    bodyA: wheelB,
                    stiffness: 1,
                    length: 0
                  });
                  Composite.addBody(car, body);
                  Composite.addBody(car, wheelA);
                  Composite.addBody(car, wheelB);
                  Composite.addConstraint(car, axelA);
                  Composite.addConstraint(car, axelB);
                  return car;
                };
                deprecated(Composites, "car", "Composites.car \u27A4 moved to car example");
                Composites.softBody = function(x, y, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
                  particleOptions = Common.extend({ inertia: Infinity }, particleOptions);
                  constraintOptions = Common.extend({ stiffness: 0.2, render: { type: "line", anchors: false } }, constraintOptions);
                  var softBody = Composites.stack(x, y, columns, rows, columnGap, rowGap, function(stackX, stackY) {
                    return Bodies.circle(stackX, stackY, particleRadius, particleOptions);
                  });
                  Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);
                  softBody.label = "Soft Body";
                  return softBody;
                };
                deprecated(Composites, "softBody", "Composites.softBody \u27A4 moved to softBody and cloth examples");
              })();
            }),
            /* 23 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Grid = {};
              module2.exports = Grid;
              var Pair = __webpack_require__(9);
              var Common = __webpack_require__(0);
              var deprecated = Common.deprecated;
              (function() {
                Grid.create = function(options) {
                  var defaults = {
                    buckets: {},
                    pairs: {},
                    pairsList: [],
                    bucketWidth: 48,
                    bucketHeight: 48
                  };
                  return Common.extend(defaults, options);
                };
                Grid.update = function(grid, bodies, engine, forceUpdate) {
                  var i, col, row, world = engine.world, buckets = grid.buckets, bucket, bucketId, gridChanged = false;
                  for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (body.isSleeping && !forceUpdate)
                      continue;
                    if (world.bounds && (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y))
                      continue;
                    var newRegion = Grid._getRegion(grid, body);
                    if (!body.region || newRegion.id !== body.region.id || forceUpdate) {
                      if (!body.region || forceUpdate)
                        body.region = newRegion;
                      var union = Grid._regionUnion(newRegion, body.region);
                      for (col = union.startCol; col <= union.endCol; col++) {
                        for (row = union.startRow; row <= union.endRow; row++) {
                          bucketId = Grid._getBucketId(col, row);
                          bucket = buckets[bucketId];
                          var isInsideNewRegion = col >= newRegion.startCol && col <= newRegion.endCol && row >= newRegion.startRow && row <= newRegion.endRow;
                          var isInsideOldRegion = col >= body.region.startCol && col <= body.region.endCol && row >= body.region.startRow && row <= body.region.endRow;
                          if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                              if (bucket)
                                Grid._bucketRemoveBody(grid, bucket, body);
                            }
                          }
                          if (body.region === newRegion || isInsideNewRegion && !isInsideOldRegion || forceUpdate) {
                            if (!bucket)
                              bucket = Grid._createBucket(buckets, bucketId);
                            Grid._bucketAddBody(grid, bucket, body);
                          }
                        }
                      }
                      body.region = newRegion;
                      gridChanged = true;
                    }
                  }
                  if (gridChanged)
                    grid.pairsList = Grid._createActivePairsList(grid);
                };
                deprecated(Grid, "update", "Grid.update \u27A4 replaced by Matter.Detector");
                Grid.clear = function(grid) {
                  grid.buckets = {};
                  grid.pairs = {};
                  grid.pairsList = [];
                };
                deprecated(Grid, "clear", "Grid.clear \u27A4 replaced by Matter.Detector");
                Grid._regionUnion = function(regionA, regionB) {
                  var startCol = Math.min(regionA.startCol, regionB.startCol), endCol = Math.max(regionA.endCol, regionB.endCol), startRow = Math.min(regionA.startRow, regionB.startRow), endRow = Math.max(regionA.endRow, regionB.endRow);
                  return Grid._createRegion(startCol, endCol, startRow, endRow);
                };
                Grid._getRegion = function(grid, body) {
                  var bounds = body.bounds, startCol = Math.floor(bounds.min.x / grid.bucketWidth), endCol = Math.floor(bounds.max.x / grid.bucketWidth), startRow = Math.floor(bounds.min.y / grid.bucketHeight), endRow = Math.floor(bounds.max.y / grid.bucketHeight);
                  return Grid._createRegion(startCol, endCol, startRow, endRow);
                };
                Grid._createRegion = function(startCol, endCol, startRow, endRow) {
                  return {
                    id: startCol + "," + endCol + "," + startRow + "," + endRow,
                    startCol,
                    endCol,
                    startRow,
                    endRow
                  };
                };
                Grid._getBucketId = function(column, row) {
                  return "C" + column + "R" + row;
                };
                Grid._createBucket = function(buckets, bucketId) {
                  var bucket = buckets[bucketId] = [];
                  return bucket;
                };
                Grid._bucketAddBody = function(grid, bucket, body) {
                  var gridPairs = grid.pairs, pairId = Pair.id, bucketLength = bucket.length, i;
                  for (i = 0; i < bucketLength; i++) {
                    var bodyB = bucket[i];
                    if (body.id === bodyB.id || body.isStatic && bodyB.isStatic)
                      continue;
                    var id = pairId(body, bodyB), pair = gridPairs[id];
                    if (pair) {
                      pair[2] += 1;
                    } else {
                      gridPairs[id] = [body, bodyB, 1];
                    }
                  }
                  bucket.push(body);
                };
                Grid._bucketRemoveBody = function(grid, bucket, body) {
                  var gridPairs = grid.pairs, pairId = Pair.id, i;
                  bucket.splice(Common.indexOf(bucket, body), 1);
                  var bucketLength = bucket.length;
                  for (i = 0; i < bucketLength; i++) {
                    var pair = gridPairs[pairId(body, bucket[i])];
                    if (pair)
                      pair[2] -= 1;
                  }
                };
                Grid._createActivePairsList = function(grid) {
                  var pair, gridPairs = grid.pairs, pairKeys = Common.keys(gridPairs), pairKeysLength = pairKeys.length, pairs = [], k;
                  for (k = 0; k < pairKeysLength; k++) {
                    pair = gridPairs[pairKeys[k]];
                    if (pair[2] > 0) {
                      pairs.push(pair);
                    } else {
                      delete gridPairs[pairKeys[k]];
                    }
                  }
                  return pairs;
                };
              })();
            }),
            /* 24 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var MouseConstraint = {};
              module2.exports = MouseConstraint;
              var Vertices = __webpack_require__(3);
              var Sleeping = __webpack_require__(7);
              var Mouse = __webpack_require__(14);
              var Events = __webpack_require__(5);
              var Detector = __webpack_require__(13);
              var Constraint = __webpack_require__(10);
              var Composite = __webpack_require__(6);
              var Common = __webpack_require__(0);
              var Bounds = __webpack_require__(1);
              (function() {
                MouseConstraint.create = function(engine, options) {
                  var mouse = (engine ? engine.mouse : null) || (options ? options.mouse : null);
                  if (!mouse) {
                    if (engine && engine.render && engine.render.canvas) {
                      mouse = Mouse.create(engine.render.canvas);
                    } else if (options && options.element) {
                      mouse = Mouse.create(options.element);
                    } else {
                      mouse = Mouse.create();
                      Common.warn("MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected");
                    }
                  }
                  var constraint = Constraint.create({
                    label: "Mouse Constraint",
                    pointA: mouse.position,
                    pointB: { x: 0, y: 0 },
                    length: 0.01,
                    stiffness: 0.1,
                    angularStiffness: 1,
                    render: {
                      strokeStyle: "#90EE90",
                      lineWidth: 3
                    }
                  });
                  var defaults = {
                    type: "mouseConstraint",
                    mouse,
                    element: null,
                    body: null,
                    constraint,
                    collisionFilter: {
                      category: 1,
                      mask: 4294967295,
                      group: 0
                    }
                  };
                  var mouseConstraint = Common.extend(defaults, options);
                  Events.on(engine, "beforeUpdate", function() {
                    var allBodies = Composite.allBodies(engine.world);
                    MouseConstraint.update(mouseConstraint, allBodies);
                    MouseConstraint._triggerEvents(mouseConstraint);
                  });
                  return mouseConstraint;
                };
                MouseConstraint.update = function(mouseConstraint, bodies) {
                  var mouse = mouseConstraint.mouse, constraint = mouseConstraint.constraint, body = mouseConstraint.body;
                  if (mouse.button === 0) {
                    if (!constraint.bodyB) {
                      for (var i = 0; i < bodies.length; i++) {
                        body = bodies[i];
                        if (Bounds.contains(body.bounds, mouse.position) && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                          for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                              constraint.pointA = mouse.position;
                              constraint.bodyB = mouseConstraint.body = body;
                              constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                              constraint.angleB = body.angle;
                              Sleeping.set(body, false);
                              Events.trigger(mouseConstraint, "startdrag", { mouse, body });
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      Sleeping.set(constraint.bodyB, false);
                      constraint.pointA = mouse.position;
                    }
                  } else {
                    constraint.bodyB = mouseConstraint.body = null;
                    constraint.pointB = null;
                    if (body)
                      Events.trigger(mouseConstraint, "enddrag", { mouse, body });
                  }
                };
                MouseConstraint._triggerEvents = function(mouseConstraint) {
                  var mouse = mouseConstraint.mouse, mouseEvents = mouse.sourceEvents;
                  if (mouseEvents.mousemove)
                    Events.trigger(mouseConstraint, "mousemove", { mouse });
                  if (mouseEvents.mousedown)
                    Events.trigger(mouseConstraint, "mousedown", { mouse });
                  if (mouseEvents.mouseup)
                    Events.trigger(mouseConstraint, "mouseup", { mouse });
                  Mouse.clearSourceEvents(mouse);
                };
              })();
            }),
            /* 25 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Query = {};
              module2.exports = Query;
              var Vector = __webpack_require__(2);
              var Collision = __webpack_require__(8);
              var Bounds = __webpack_require__(1);
              var Bodies = __webpack_require__(12);
              var Vertices = __webpack_require__(3);
              (function() {
                Query.collides = function(body, bodies) {
                  var collisions = [], bodiesLength = bodies.length, bounds = body.bounds, collides = Collision.collides, overlaps = Bounds.overlaps;
                  for (var i = 0; i < bodiesLength; i++) {
                    var bodyA = bodies[i], partsALength = bodyA.parts.length, partsAStart = partsALength === 1 ? 0 : 1;
                    if (overlaps(bodyA.bounds, bounds)) {
                      for (var j = partsAStart; j < partsALength; j++) {
                        var part = bodyA.parts[j];
                        if (overlaps(part.bounds, bounds)) {
                          var collision = collides(part, body);
                          if (collision) {
                            collisions.push(collision);
                            break;
                          }
                        }
                      }
                    }
                  }
                  return collisions;
                };
                Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
                  rayWidth = rayWidth || 1e-100;
                  var rayAngle = Vector.angle(startPoint, endPoint), rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)), rayX = (endPoint.x + startPoint.x) * 0.5, rayY = (endPoint.y + startPoint.y) * 0.5, ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }), collisions = Query.collides(ray, bodies);
                  for (var i = 0; i < collisions.length; i += 1) {
                    var collision = collisions[i];
                    collision.body = collision.bodyB = collision.bodyA;
                  }
                  return collisions;
                };
                Query.region = function(bodies, bounds, outside) {
                  var result = [];
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i], overlaps = Bounds.overlaps(body.bounds, bounds);
                    if (overlaps && !outside || !overlaps && outside)
                      result.push(body);
                  }
                  return result;
                };
                Query.point = function(bodies, point) {
                  var result = [];
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (Bounds.contains(body.bounds, point)) {
                      for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                        var part = body.parts[j];
                        if (Bounds.contains(part.bounds, point) && Vertices.contains(part.vertices, point)) {
                          result.push(body);
                          break;
                        }
                      }
                    }
                  }
                  return result;
                };
              })();
            }),
            /* 26 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Render = {};
              module2.exports = Render;
              var Body = __webpack_require__(4);
              var Common = __webpack_require__(0);
              var Composite = __webpack_require__(6);
              var Bounds = __webpack_require__(1);
              var Events = __webpack_require__(5);
              var Vector = __webpack_require__(2);
              var Mouse = __webpack_require__(14);
              (function() {
                var _requestAnimationFrame, _cancelAnimationFrame;
                if (typeof window !== "undefined") {
                  _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                    window.setTimeout(function() {
                      callback(Common.now());
                    }, 1e3 / 60);
                  };
                  _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
                }
                Render._goodFps = 30;
                Render._goodDelta = 1e3 / 60;
                Render.create = function(options) {
                  var defaults = {
                    engine: null,
                    element: null,
                    canvas: null,
                    mouse: null,
                    frameRequestId: null,
                    timing: {
                      historySize: 60,
                      delta: 0,
                      deltaHistory: [],
                      lastTime: 0,
                      lastTimestamp: 0,
                      lastElapsed: 0,
                      timestampElapsed: 0,
                      timestampElapsedHistory: [],
                      engineDeltaHistory: [],
                      engineElapsedHistory: [],
                      engineUpdatesHistory: [],
                      elapsedHistory: []
                    },
                    options: {
                      width: 800,
                      height: 600,
                      pixelRatio: 1,
                      background: "#14151f",
                      wireframeBackground: "#14151f",
                      wireframeStrokeStyle: "#bbb",
                      hasBounds: !!options.bounds,
                      enabled: true,
                      wireframes: true,
                      showSleeping: true,
                      showDebug: false,
                      showStats: false,
                      showPerformance: false,
                      showBounds: false,
                      showVelocity: false,
                      showCollisions: false,
                      showSeparations: false,
                      showAxes: false,
                      showPositions: false,
                      showAngleIndicator: false,
                      showIds: false,
                      showVertexNumbers: false,
                      showConvexHulls: false,
                      showInternalEdges: false,
                      showMousePosition: false
                    }
                  };
                  var render = Common.extend(defaults, options);
                  if (render.canvas) {
                    render.canvas.width = render.options.width || render.canvas.width;
                    render.canvas.height = render.options.height || render.canvas.height;
                  }
                  render.mouse = options.mouse;
                  render.engine = options.engine;
                  render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
                  render.context = render.canvas.getContext("2d");
                  render.textures = {};
                  render.bounds = render.bounds || {
                    min: {
                      x: 0,
                      y: 0
                    },
                    max: {
                      x: render.canvas.width,
                      y: render.canvas.height
                    }
                  };
                  render.controller = Render;
                  render.options.showBroadphase = false;
                  if (render.options.pixelRatio !== 1) {
                    Render.setPixelRatio(render, render.options.pixelRatio);
                  }
                  if (Common.isElement(render.element)) {
                    render.element.appendChild(render.canvas);
                  }
                  return render;
                };
                Render.run = function(render) {
                  (function loop(time) {
                    render.frameRequestId = _requestAnimationFrame(loop);
                    _updateTiming(render, time);
                    Render.world(render, time);
                    render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                    if (render.options.showStats || render.options.showDebug) {
                      Render.stats(render, render.context, time);
                    }
                    if (render.options.showPerformance || render.options.showDebug) {
                      Render.performance(render, render.context, time);
                    }
                    render.context.setTransform(1, 0, 0, 1, 0, 0);
                  })();
                };
                Render.stop = function(render) {
                  _cancelAnimationFrame(render.frameRequestId);
                };
                Render.setPixelRatio = function(render, pixelRatio) {
                  var options = render.options, canvas = render.canvas;
                  if (pixelRatio === "auto") {
                    pixelRatio = _getPixelRatio(canvas);
                  }
                  options.pixelRatio = pixelRatio;
                  canvas.setAttribute("data-pixel-ratio", pixelRatio);
                  canvas.width = options.width * pixelRatio;
                  canvas.height = options.height * pixelRatio;
                  canvas.style.width = options.width + "px";
                  canvas.style.height = options.height + "px";
                };
                Render.setSize = function(render, width, height) {
                  render.options.width = width;
                  render.options.height = height;
                  render.bounds.max.x = render.bounds.min.x + width;
                  render.bounds.max.y = render.bounds.min.y + height;
                  if (render.options.pixelRatio !== 1) {
                    Render.setPixelRatio(render, render.options.pixelRatio);
                  } else {
                    render.canvas.width = width;
                    render.canvas.height = height;
                  }
                };
                Render.lookAt = function(render, objects, padding, center) {
                  center = typeof center !== "undefined" ? center : true;
                  objects = Common.isArray(objects) ? objects : [objects];
                  padding = padding || {
                    x: 0,
                    y: 0
                  };
                  var bounds = {
                    min: { x: Infinity, y: Infinity },
                    max: { x: -Infinity, y: -Infinity }
                  };
                  for (var i = 0; i < objects.length; i += 1) {
                    var object = objects[i], min = object.bounds ? object.bounds.min : object.min || object.position || object, max = object.bounds ? object.bounds.max : object.max || object.position || object;
                    if (min && max) {
                      if (min.x < bounds.min.x)
                        bounds.min.x = min.x;
                      if (max.x > bounds.max.x)
                        bounds.max.x = max.x;
                      if (min.y < bounds.min.y)
                        bounds.min.y = min.y;
                      if (max.y > bounds.max.y)
                        bounds.max.y = max.y;
                    }
                  }
                  var width = bounds.max.x - bounds.min.x + 2 * padding.x, height = bounds.max.y - bounds.min.y + 2 * padding.y, viewHeight = render.canvas.height, viewWidth = render.canvas.width, outerRatio = viewWidth / viewHeight, innerRatio = width / height, scaleX = 1, scaleY = 1;
                  if (innerRatio > outerRatio) {
                    scaleY = innerRatio / outerRatio;
                  } else {
                    scaleX = outerRatio / innerRatio;
                  }
                  render.options.hasBounds = true;
                  render.bounds.min.x = bounds.min.x;
                  render.bounds.max.x = bounds.min.x + width * scaleX;
                  render.bounds.min.y = bounds.min.y;
                  render.bounds.max.y = bounds.min.y + height * scaleY;
                  if (center) {
                    render.bounds.min.x += width * 0.5 - width * scaleX * 0.5;
                    render.bounds.max.x += width * 0.5 - width * scaleX * 0.5;
                    render.bounds.min.y += height * 0.5 - height * scaleY * 0.5;
                    render.bounds.max.y += height * 0.5 - height * scaleY * 0.5;
                  }
                  render.bounds.min.x -= padding.x;
                  render.bounds.max.x -= padding.x;
                  render.bounds.min.y -= padding.y;
                  render.bounds.max.y -= padding.y;
                  if (render.mouse) {
                    Mouse.setScale(render.mouse, {
                      x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                      y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
                    });
                    Mouse.setOffset(render.mouse, render.bounds.min);
                  }
                };
                Render.startViewTransform = function(render) {
                  var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
                  render.context.setTransform(
                    render.options.pixelRatio / boundsScaleX,
                    0,
                    0,
                    render.options.pixelRatio / boundsScaleY,
                    0,
                    0
                  );
                  render.context.translate(-render.bounds.min.x, -render.bounds.min.y);
                };
                Render.endViewTransform = function(render) {
                  render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                };
                Render.world = function(render, time) {
                  var startTime = Common.now(), engine = render.engine, world = engine.world, canvas = render.canvas, context = render.context, options = render.options, timing = render.timing;
                  var allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world), background = options.wireframes ? options.wireframeBackground : options.background, bodies = [], constraints = [], i;
                  var event = {
                    timestamp: engine.timing.timestamp
                  };
                  Events.trigger(render, "beforeRender", event);
                  if (render.currentBackground !== background)
                    _applyBackground(render, background);
                  context.globalCompositeOperation = "source-in";
                  context.fillStyle = "transparent";
                  context.fillRect(0, 0, canvas.width, canvas.height);
                  context.globalCompositeOperation = "source-over";
                  if (options.hasBounds) {
                    for (i = 0; i < allBodies.length; i++) {
                      var body = allBodies[i];
                      if (Bounds.overlaps(body.bounds, render.bounds))
                        bodies.push(body);
                    }
                    for (i = 0; i < allConstraints.length; i++) {
                      var constraint = allConstraints[i], bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointAWorld = constraint.pointA, pointBWorld = constraint.pointB;
                      if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                      if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);
                      if (!pointAWorld || !pointBWorld)
                        continue;
                      if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                        constraints.push(constraint);
                    }
                    Render.startViewTransform(render);
                    if (render.mouse) {
                      Mouse.setScale(render.mouse, {
                        x: (render.bounds.max.x - render.bounds.min.x) / render.options.width,
                        y: (render.bounds.max.y - render.bounds.min.y) / render.options.height
                      });
                      Mouse.setOffset(render.mouse, render.bounds.min);
                    }
                  } else {
                    constraints = allConstraints;
                    bodies = allBodies;
                    if (render.options.pixelRatio !== 1) {
                      render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
                    }
                  }
                  if (!options.wireframes || engine.enableSleeping && options.showSleeping) {
                    Render.bodies(render, bodies, context);
                  } else {
                    if (options.showConvexHulls)
                      Render.bodyConvexHulls(render, bodies, context);
                    Render.bodyWireframes(render, bodies, context);
                  }
                  if (options.showBounds)
                    Render.bodyBounds(render, bodies, context);
                  if (options.showAxes || options.showAngleIndicator)
                    Render.bodyAxes(render, bodies, context);
                  if (options.showPositions)
                    Render.bodyPositions(render, bodies, context);
                  if (options.showVelocity)
                    Render.bodyVelocity(render, bodies, context);
                  if (options.showIds)
                    Render.bodyIds(render, bodies, context);
                  if (options.showSeparations)
                    Render.separations(render, engine.pairs.list, context);
                  if (options.showCollisions)
                    Render.collisions(render, engine.pairs.list, context);
                  if (options.showVertexNumbers)
                    Render.vertexNumbers(render, bodies, context);
                  if (options.showMousePosition)
                    Render.mousePosition(render, render.mouse, context);
                  Render.constraints(constraints, context);
                  if (options.hasBounds) {
                    Render.endViewTransform(render);
                  }
                  Events.trigger(render, "afterRender", event);
                  timing.lastElapsed = Common.now() - startTime;
                };
                Render.stats = function(render, context, time) {
                  var engine = render.engine, world = engine.world, bodies = Composite.allBodies(world), parts = 0, width = 55, height = 44, x = 0, y = 0;
                  for (var i = 0; i < bodies.length; i += 1) {
                    parts += bodies[i].parts.length;
                  }
                  var sections = {
                    "Part": parts,
                    "Body": bodies.length,
                    "Cons": Composite.allConstraints(world).length,
                    "Comp": Composite.allComposites(world).length,
                    "Pair": engine.pairs.list.length
                  };
                  context.fillStyle = "#0e0f19";
                  context.fillRect(x, y, width * 5.5, height);
                  context.font = "12px Arial";
                  context.textBaseline = "top";
                  context.textAlign = "right";
                  for (var key in sections) {
                    var section = sections[key];
                    context.fillStyle = "#aaa";
                    context.fillText(key, x + width, y + 8);
                    context.fillStyle = "#eee";
                    context.fillText(section, x + width, y + 26);
                    x += width;
                  }
                };
                Render.performance = function(render, context) {
                  var engine = render.engine, timing = render.timing, deltaHistory = timing.deltaHistory, elapsedHistory = timing.elapsedHistory, timestampElapsedHistory = timing.timestampElapsedHistory, engineDeltaHistory = timing.engineDeltaHistory, engineUpdatesHistory = timing.engineUpdatesHistory, engineElapsedHistory = timing.engineElapsedHistory, lastEngineUpdatesPerFrame = engine.timing.lastUpdatesPerFrame, lastEngineDelta = engine.timing.lastDelta;
                  var deltaMean = _mean(deltaHistory), elapsedMean = _mean(elapsedHistory), engineDeltaMean = _mean(engineDeltaHistory), engineUpdatesMean = _mean(engineUpdatesHistory), engineElapsedMean = _mean(engineElapsedHistory), timestampElapsedMean = _mean(timestampElapsedHistory), rateMean = timestampElapsedMean / deltaMean || 0, neededUpdatesPerFrame = Math.round(deltaMean / lastEngineDelta), fps = 1e3 / deltaMean || 0;
                  var graphHeight = 4, gap = 12, width = 60, height = 34, x = 10, y = 69;
                  context.fillStyle = "#0e0f19";
                  context.fillRect(0, 50, gap * 5 + width * 6 + 22, height);
                  Render.status(
                    context,
                    x,
                    y,
                    width,
                    graphHeight,
                    deltaHistory.length,
                    Math.round(fps) + " fps",
                    fps / Render._goodFps,
                    function(i) {
                      return deltaHistory[i] / deltaMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + gap + width,
                    y,
                    width,
                    graphHeight,
                    engineDeltaHistory.length,
                    lastEngineDelta.toFixed(2) + " dt",
                    Render._goodDelta / lastEngineDelta,
                    function(i) {
                      return engineDeltaHistory[i] / engineDeltaMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 2,
                    y,
                    width,
                    graphHeight,
                    engineUpdatesHistory.length,
                    lastEngineUpdatesPerFrame + " upf",
                    Math.pow(Common.clamp(engineUpdatesMean / neededUpdatesPerFrame || 1, 0, 1), 4),
                    function(i) {
                      return engineUpdatesHistory[i] / engineUpdatesMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 3,
                    y,
                    width,
                    graphHeight,
                    engineElapsedHistory.length,
                    engineElapsedMean.toFixed(2) + " ut",
                    1 - lastEngineUpdatesPerFrame * engineElapsedMean / Render._goodFps,
                    function(i) {
                      return engineElapsedHistory[i] / engineElapsedMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 4,
                    y,
                    width,
                    graphHeight,
                    elapsedHistory.length,
                    elapsedMean.toFixed(2) + " rt",
                    1 - elapsedMean / Render._goodFps,
                    function(i) {
                      return elapsedHistory[i] / elapsedMean - 1;
                    }
                  );
                  Render.status(
                    context,
                    x + (gap + width) * 5,
                    y,
                    width,
                    graphHeight,
                    timestampElapsedHistory.length,
                    rateMean.toFixed(2) + " x",
                    rateMean * rateMean * rateMean,
                    function(i) {
                      return (timestampElapsedHistory[i] / deltaHistory[i] / rateMean || 0) - 1;
                    }
                  );
                };
                Render.status = function(context, x, y, width, height, count, label, indicator, plotY) {
                  context.strokeStyle = "#888";
                  context.fillStyle = "#444";
                  context.lineWidth = 1;
                  context.fillRect(x, y + 7, width, 1);
                  context.beginPath();
                  context.moveTo(x, y + 7 - height * Common.clamp(0.4 * plotY(0), -2, 2));
                  for (var i = 0; i < width; i += 1) {
                    context.lineTo(x + i, y + 7 - (i < count ? height * Common.clamp(0.4 * plotY(i), -2, 2) : 0));
                  }
                  context.stroke();
                  context.fillStyle = "hsl(" + Common.clamp(25 + 95 * indicator, 0, 120) + ",100%,60%)";
                  context.fillRect(x, y - 7, 4, 4);
                  context.font = "12px Arial";
                  context.textBaseline = "middle";
                  context.textAlign = "right";
                  context.fillStyle = "#eee";
                  context.fillText(label, x + width, y - 5);
                };
                Render.constraints = function(constraints, context) {
                  var c = context;
                  for (var i = 0; i < constraints.length; i++) {
                    var constraint = constraints[i];
                    if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                      continue;
                    var bodyA = constraint.bodyA, bodyB = constraint.bodyB, start, end;
                    if (bodyA) {
                      start = Vector.add(bodyA.position, constraint.pointA);
                    } else {
                      start = constraint.pointA;
                    }
                    if (constraint.render.type === "pin") {
                      c.beginPath();
                      c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                      c.closePath();
                    } else {
                      if (bodyB) {
                        end = Vector.add(bodyB.position, constraint.pointB);
                      } else {
                        end = constraint.pointB;
                      }
                      c.beginPath();
                      c.moveTo(start.x, start.y);
                      if (constraint.render.type === "spring") {
                        var delta = Vector.sub(end, start), normal = Vector.perp(Vector.normalise(delta)), coils = Math.ceil(Common.clamp(constraint.length / 5, 12, 20)), offset;
                        for (var j = 1; j < coils; j += 1) {
                          offset = j % 2 === 0 ? 1 : -1;
                          c.lineTo(
                            start.x + delta.x * (j / coils) + normal.x * offset * 4,
                            start.y + delta.y * (j / coils) + normal.y * offset * 4
                          );
                        }
                      }
                      c.lineTo(end.x, end.y);
                    }
                    if (constraint.render.lineWidth) {
                      c.lineWidth = constraint.render.lineWidth;
                      c.strokeStyle = constraint.render.strokeStyle;
                      c.stroke();
                    }
                    if (constraint.render.anchors) {
                      c.fillStyle = constraint.render.strokeStyle;
                      c.beginPath();
                      c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
                      c.arc(end.x, end.y, 3, 0, 2 * Math.PI);
                      c.closePath();
                      c.fill();
                    }
                  }
                };
                Render.bodies = function(render, bodies, context) {
                  var c = context, engine = render.engine, options = render.options, showInternalEdges = options.showInternalEdges || !options.wireframes, body, part, i, k;
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      if (!part.render.visible)
                        continue;
                      if (options.showSleeping && body.isSleeping) {
                        c.globalAlpha = 0.5 * part.render.opacity;
                      } else if (part.render.opacity !== 1) {
                        c.globalAlpha = part.render.opacity;
                      }
                      if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                        var sprite = part.render.sprite, texture = _getTexture(render, sprite.texture);
                        c.translate(part.position.x, part.position.y);
                        c.rotate(part.angle);
                        c.drawImage(
                          texture,
                          texture.width * -sprite.xOffset * sprite.xScale,
                          texture.height * -sprite.yOffset * sprite.yScale,
                          texture.width * sprite.xScale,
                          texture.height * sprite.yScale
                        );
                        c.rotate(-part.angle);
                        c.translate(-part.position.x, -part.position.y);
                      } else {
                        if (part.circleRadius) {
                          c.beginPath();
                          c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                        } else {
                          c.beginPath();
                          c.moveTo(part.vertices[0].x, part.vertices[0].y);
                          for (var j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                              c.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                              c.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }
                            if (part.vertices[j].isInternal && !showInternalEdges) {
                              c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                          }
                          c.lineTo(part.vertices[0].x, part.vertices[0].y);
                          c.closePath();
                        }
                        if (!options.wireframes) {
                          c.fillStyle = part.render.fillStyle;
                          if (part.render.lineWidth) {
                            c.lineWidth = part.render.lineWidth;
                            c.strokeStyle = part.render.strokeStyle;
                            c.stroke();
                          }
                          c.fill();
                        } else {
                          c.lineWidth = 1;
                          c.strokeStyle = render.options.wireframeStrokeStyle;
                          c.stroke();
                        }
                      }
                      c.globalAlpha = 1;
                    }
                  }
                };
                Render.bodyWireframes = function(render, bodies, context) {
                  var c = context, showInternalEdges = render.options.showInternalEdges, body, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      c.moveTo(part.vertices[0].x, part.vertices[0].y);
                      for (j = 1; j < part.vertices.length; j++) {
                        if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                          c.lineTo(part.vertices[j].x, part.vertices[j].y);
                        } else {
                          c.moveTo(part.vertices[j].x, part.vertices[j].y);
                        }
                        if (part.vertices[j].isInternal && !showInternalEdges) {
                          c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                        }
                      }
                      c.lineTo(part.vertices[0].x, part.vertices[0].y);
                    }
                  }
                  c.lineWidth = 1;
                  c.strokeStyle = render.options.wireframeStrokeStyle;
                  c.stroke();
                };
                Render.bodyConvexHulls = function(render, bodies, context) {
                  var c = context, body, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible || body.parts.length === 1)
                      continue;
                    c.moveTo(body.vertices[0].x, body.vertices[0].y);
                    for (j = 1; j < body.vertices.length; j++) {
                      c.lineTo(body.vertices[j].x, body.vertices[j].y);
                    }
                    c.lineTo(body.vertices[0].x, body.vertices[0].y);
                  }
                  c.lineWidth = 1;
                  c.strokeStyle = "rgba(255,255,255,0.2)";
                  c.stroke();
                };
                Render.vertexNumbers = function(render, bodies, context) {
                  var c = context, i, j, k;
                  for (i = 0; i < bodies.length; i++) {
                    var parts = bodies[i].parts;
                    for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                      var part = parts[k];
                      for (j = 0; j < part.vertices.length; j++) {
                        c.fillStyle = "rgba(255,255,255,0.2)";
                        c.fillText(i + "_" + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                      }
                    }
                  }
                };
                Render.mousePosition = function(render, mouse, context) {
                  var c = context;
                  c.fillStyle = "rgba(255,255,255,0.8)";
                  c.fillText(mouse.position.x + "  " + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
                };
                Render.bodyBounds = function(render, bodies, context) {
                  var c = context, engine = render.engine, options = render.options;
                  c.beginPath();
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (body.render.visible) {
                      var parts = bodies[i].parts;
                      for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        var part = parts[j];
                        c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                      }
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,255,255,0.08)";
                  } else {
                    c.strokeStyle = "rgba(0,0,0,0.1)";
                  }
                  c.lineWidth = 1;
                  c.stroke();
                };
                Render.bodyAxes = function(render, bodies, context) {
                  var c = context, engine = render.engine, options = render.options, part, i, j, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    var body = bodies[i], parts = body.parts;
                    if (!body.render.visible)
                      continue;
                    if (options.showAxes) {
                      for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                          var axis = part.axes[k];
                          c.moveTo(part.position.x, part.position.y);
                          c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                        }
                      }
                    } else {
                      for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        part = parts[j];
                        for (k = 0; k < part.axes.length; k++) {
                          c.moveTo(part.position.x, part.position.y);
                          c.lineTo(
                            (part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2,
                            (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2
                          );
                        }
                      }
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "indianred";
                    c.lineWidth = 1;
                  } else {
                    c.strokeStyle = "rgba(255, 255, 255, 0.4)";
                    c.globalCompositeOperation = "overlay";
                    c.lineWidth = 2;
                  }
                  c.stroke();
                  c.globalCompositeOperation = "source-over";
                };
                Render.bodyPositions = function(render, bodies, context) {
                  var c = context, engine = render.engine, options = render.options, body, part, i, k;
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    for (k = 0; k < body.parts.length; k++) {
                      part = body.parts[k];
                      c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                      c.closePath();
                    }
                  }
                  if (options.wireframes) {
                    c.fillStyle = "indianred";
                  } else {
                    c.fillStyle = "rgba(0,0,0,0.5)";
                  }
                  c.fill();
                  c.beginPath();
                  for (i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (body.render.visible) {
                      c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                      c.closePath();
                    }
                  }
                  c.fillStyle = "rgba(255,165,0,0.8)";
                  c.fill();
                };
                Render.bodyVelocity = function(render, bodies, context) {
                  var c = context;
                  c.beginPath();
                  for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];
                    if (!body.render.visible)
                      continue;
                    var velocity = Body.getVelocity(body);
                    c.moveTo(body.position.x, body.position.y);
                    c.lineTo(body.position.x + velocity.x, body.position.y + velocity.y);
                  }
                  c.lineWidth = 3;
                  c.strokeStyle = "cornflowerblue";
                  c.stroke();
                };
                Render.bodyIds = function(render, bodies, context) {
                  var c = context, i, j;
                  for (i = 0; i < bodies.length; i++) {
                    if (!bodies[i].render.visible)
                      continue;
                    var parts = bodies[i].parts;
                    for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                      var part = parts[j];
                      c.font = "12px Arial";
                      c.fillStyle = "rgba(255,255,255,0.5)";
                      c.fillText(part.id, part.position.x + 10, part.position.y - 10);
                    }
                  }
                };
                Render.collisions = function(render, pairs, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    for (j = 0; j < pair.contactCount; j++) {
                      var contact = pair.contacts[j], vertex = contact.vertex;
                      c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
                    }
                  }
                  if (options.wireframes) {
                    c.fillStyle = "rgba(255,255,255,0.7)";
                  } else {
                    c.fillStyle = "orange";
                  }
                  c.fill();
                  c.beginPath();
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    if (pair.contactCount > 0) {
                      var normalPosX = pair.contacts[0].vertex.x, normalPosY = pair.contacts[0].vertex.y;
                      if (pair.contactCount === 2) {
                        normalPosX = (pair.contacts[0].vertex.x + pair.contacts[1].vertex.x) / 2;
                        normalPosY = (pair.contacts[0].vertex.y + pair.contacts[1].vertex.y) / 2;
                      }
                      if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                        c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                      } else {
                        c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                      }
                      c.lineTo(normalPosX, normalPosY);
                    }
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,165,0,0.7)";
                  } else {
                    c.strokeStyle = "orange";
                  }
                  c.lineWidth = 1;
                  c.stroke();
                };
                Render.separations = function(render, pairs, context) {
                  var c = context, options = render.options, pair, collision, corrected, bodyA, bodyB, i, j;
                  c.beginPath();
                  for (i = 0; i < pairs.length; i++) {
                    pair = pairs[i];
                    if (!pair.isActive)
                      continue;
                    collision = pair.collision;
                    bodyA = collision.bodyA;
                    bodyB = collision.bodyB;
                    var k = 1;
                    if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                    if (bodyB.isStatic) k = 0;
                    c.moveTo(bodyB.position.x, bodyB.position.y);
                    c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);
                    k = 1;
                    if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
                    if (bodyA.isStatic) k = 0;
                    c.moveTo(bodyA.position.x, bodyA.position.y);
                    c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
                  }
                  if (options.wireframes) {
                    c.strokeStyle = "rgba(255,165,0,0.5)";
                  } else {
                    c.strokeStyle = "orange";
                  }
                  c.stroke();
                };
                Render.inspector = function(inspector, context) {
                  var engine = inspector.engine, selected = inspector.selected, render = inspector.render, options = render.options, bounds;
                  if (options.hasBounds) {
                    var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
                    context.scale(1 / boundsScaleX, 1 / boundsScaleY);
                    context.translate(-render.bounds.min.x, -render.bounds.min.y);
                  }
                  for (var i = 0; i < selected.length; i++) {
                    var item = selected[i].data;
                    context.translate(0.5, 0.5);
                    context.lineWidth = 1;
                    context.strokeStyle = "rgba(255,165,0,0.9)";
                    context.setLineDash([1, 2]);
                    switch (item.type) {
                      case "body":
                        bounds = item.bounds;
                        context.beginPath();
                        context.rect(
                          Math.floor(bounds.min.x - 3),
                          Math.floor(bounds.min.y - 3),
                          Math.floor(bounds.max.x - bounds.min.x + 6),
                          Math.floor(bounds.max.y - bounds.min.y + 6)
                        );
                        context.closePath();
                        context.stroke();
                        break;
                      case "constraint":
                        var point = item.pointA;
                        if (item.bodyA)
                          point = item.pointB;
                        context.beginPath();
                        context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                        context.closePath();
                        context.stroke();
                        break;
                    }
                    context.setLineDash([]);
                    context.translate(-0.5, -0.5);
                  }
                  if (inspector.selectStart !== null) {
                    context.translate(0.5, 0.5);
                    context.lineWidth = 1;
                    context.strokeStyle = "rgba(255,165,0,0.6)";
                    context.fillStyle = "rgba(255,165,0,0.1)";
                    bounds = inspector.selectBounds;
                    context.beginPath();
                    context.rect(
                      Math.floor(bounds.min.x),
                      Math.floor(bounds.min.y),
                      Math.floor(bounds.max.x - bounds.min.x),
                      Math.floor(bounds.max.y - bounds.min.y)
                    );
                    context.closePath();
                    context.stroke();
                    context.fill();
                    context.translate(-0.5, -0.5);
                  }
                  if (options.hasBounds)
                    context.setTransform(1, 0, 0, 1, 0, 0);
                };
                var _updateTiming = function(render, time) {
                  var engine = render.engine, timing = render.timing, historySize = timing.historySize, timestamp = engine.timing.timestamp;
                  timing.delta = time - timing.lastTime || Render._goodDelta;
                  timing.lastTime = time;
                  timing.timestampElapsed = timestamp - timing.lastTimestamp || 0;
                  timing.lastTimestamp = timestamp;
                  timing.deltaHistory.unshift(timing.delta);
                  timing.deltaHistory.length = Math.min(timing.deltaHistory.length, historySize);
                  timing.engineDeltaHistory.unshift(engine.timing.lastDelta);
                  timing.engineDeltaHistory.length = Math.min(timing.engineDeltaHistory.length, historySize);
                  timing.timestampElapsedHistory.unshift(timing.timestampElapsed);
                  timing.timestampElapsedHistory.length = Math.min(timing.timestampElapsedHistory.length, historySize);
                  timing.engineUpdatesHistory.unshift(engine.timing.lastUpdatesPerFrame);
                  timing.engineUpdatesHistory.length = Math.min(timing.engineUpdatesHistory.length, historySize);
                  timing.engineElapsedHistory.unshift(engine.timing.lastElapsed);
                  timing.engineElapsedHistory.length = Math.min(timing.engineElapsedHistory.length, historySize);
                  timing.elapsedHistory.unshift(timing.lastElapsed);
                  timing.elapsedHistory.length = Math.min(timing.elapsedHistory.length, historySize);
                };
                var _mean = function(values) {
                  var result = 0;
                  for (var i = 0; i < values.length; i += 1) {
                    result += values[i];
                  }
                  return result / values.length || 0;
                };
                var _createCanvas = function(width, height) {
                  var canvas = document.createElement("canvas");
                  canvas.width = width;
                  canvas.height = height;
                  canvas.oncontextmenu = function() {
                    return false;
                  };
                  canvas.onselectstart = function() {
                    return false;
                  };
                  return canvas;
                };
                var _getPixelRatio = function(canvas) {
                  var context = canvas.getContext("2d"), devicePixelRatio = window.devicePixelRatio || 1, backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
                  return devicePixelRatio / backingStorePixelRatio;
                };
                var _getTexture = function(render, imagePath) {
                  var image = render.textures[imagePath];
                  if (image)
                    return image;
                  image = render.textures[imagePath] = new Image();
                  image.src = imagePath;
                  return image;
                };
                var _applyBackground = function(render, background) {
                  var cssBackground = background;
                  if (/(jpg|gif|png)$/.test(background))
                    cssBackground = "url(" + background + ")";
                  render.canvas.style.background = cssBackground;
                  render.canvas.style.backgroundSize = "contain";
                  render.currentBackground = background;
                };
              })();
            }),
            /* 27 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Runner = {};
              module2.exports = Runner;
              var Events = __webpack_require__(5);
              var Engine = __webpack_require__(17);
              var Common = __webpack_require__(0);
              (function() {
                Runner._maxFrameDelta = 1e3 / 15;
                Runner._frameDeltaFallback = 1e3 / 60;
                Runner._timeBufferMargin = 1.5;
                Runner._elapsedNextEstimate = 1;
                Runner._smoothingLowerBound = 0.1;
                Runner._smoothingUpperBound = 0.9;
                Runner.create = function(options) {
                  var defaults = {
                    delta: 1e3 / 60,
                    frameDelta: null,
                    frameDeltaSmoothing: true,
                    frameDeltaSnapping: true,
                    frameDeltaHistory: [],
                    frameDeltaHistorySize: 100,
                    frameRequestId: null,
                    timeBuffer: 0,
                    timeLastTick: null,
                    maxUpdates: null,
                    maxFrameTime: 1e3 / 30,
                    lastUpdatesDeferred: 0,
                    enabled: true
                  };
                  var runner = Common.extend(defaults, options);
                  runner.fps = 0;
                  return runner;
                };
                Runner.run = function(runner, engine) {
                  runner.timeBuffer = Runner._frameDeltaFallback;
                  (function onFrame(time) {
                    runner.frameRequestId = Runner._onNextFrame(runner, onFrame);
                    if (time && runner.enabled) {
                      Runner.tick(runner, engine, time);
                    }
                  })();
                  return runner;
                };
                Runner.tick = function(runner, engine, time) {
                  var tickStartTime = Common.now(), engineDelta = runner.delta, updateCount = 0;
                  var frameDelta = time - runner.timeLastTick;
                  if (!frameDelta || !runner.timeLastTick || frameDelta > Math.max(Runner._maxFrameDelta, runner.maxFrameTime)) {
                    frameDelta = runner.frameDelta || Runner._frameDeltaFallback;
                  }
                  if (runner.frameDeltaSmoothing) {
                    runner.frameDeltaHistory.push(frameDelta);
                    runner.frameDeltaHistory = runner.frameDeltaHistory.slice(-runner.frameDeltaHistorySize);
                    var deltaHistorySorted = runner.frameDeltaHistory.slice(0).sort();
                    var deltaHistoryWindow = runner.frameDeltaHistory.slice(
                      deltaHistorySorted.length * Runner._smoothingLowerBound,
                      deltaHistorySorted.length * Runner._smoothingUpperBound
                    );
                    var frameDeltaSmoothed = _mean(deltaHistoryWindow);
                    frameDelta = frameDeltaSmoothed || frameDelta;
                  }
                  if (runner.frameDeltaSnapping) {
                    frameDelta = 1e3 / Math.round(1e3 / frameDelta);
                  }
                  runner.frameDelta = frameDelta;
                  runner.timeLastTick = time;
                  runner.timeBuffer += runner.frameDelta;
                  runner.timeBuffer = Common.clamp(
                    runner.timeBuffer,
                    0,
                    runner.frameDelta + engineDelta * Runner._timeBufferMargin
                  );
                  runner.lastUpdatesDeferred = 0;
                  var maxUpdates = runner.maxUpdates || Math.ceil(runner.maxFrameTime / engineDelta);
                  var event = {
                    timestamp: engine.timing.timestamp
                  };
                  Events.trigger(runner, "beforeTick", event);
                  Events.trigger(runner, "tick", event);
                  var updateStartTime = Common.now();
                  while (engineDelta > 0 && runner.timeBuffer >= engineDelta * Runner._timeBufferMargin) {
                    Events.trigger(runner, "beforeUpdate", event);
                    Engine.update(engine, engineDelta);
                    Events.trigger(runner, "afterUpdate", event);
                    runner.timeBuffer -= engineDelta;
                    updateCount += 1;
                    var elapsedTimeTotal = Common.now() - tickStartTime, elapsedTimeUpdates = Common.now() - updateStartTime, elapsedNextEstimate = elapsedTimeTotal + Runner._elapsedNextEstimate * elapsedTimeUpdates / updateCount;
                    if (updateCount >= maxUpdates || elapsedNextEstimate > runner.maxFrameTime) {
                      runner.lastUpdatesDeferred = Math.round(Math.max(0, runner.timeBuffer / engineDelta - Runner._timeBufferMargin));
                      break;
                    }
                  }
                  engine.timing.lastUpdatesPerFrame = updateCount;
                  Events.trigger(runner, "afterTick", event);
                  if (runner.frameDeltaHistory.length >= 100) {
                    if (runner.lastUpdatesDeferred && Math.round(runner.frameDelta / engineDelta) > maxUpdates) {
                      Common.warnOnce("Matter.Runner: runner reached runner.maxUpdates, see docs.");
                    } else if (runner.lastUpdatesDeferred) {
                      Common.warnOnce("Matter.Runner: runner reached runner.maxFrameTime, see docs.");
                    }
                    if (typeof runner.isFixed !== "undefined") {
                      Common.warnOnce("Matter.Runner: runner.isFixed is now redundant, see docs.");
                    }
                    if (runner.deltaMin || runner.deltaMax) {
                      Common.warnOnce("Matter.Runner: runner.deltaMin and runner.deltaMax were removed, see docs.");
                    }
                    if (runner.fps !== 0) {
                      Common.warnOnce("Matter.Runner: runner.fps was replaced by runner.delta, see docs.");
                    }
                  }
                };
                Runner.stop = function(runner) {
                  Runner._cancelNextFrame(runner);
                };
                Runner._onNextFrame = function(runner, callback) {
                  if (typeof window !== "undefined" && window.requestAnimationFrame) {
                    runner.frameRequestId = window.requestAnimationFrame(callback);
                  } else {
                    throw new Error("Matter.Runner: missing required global window.requestAnimationFrame.");
                  }
                  return runner.frameRequestId;
                };
                Runner._cancelNextFrame = function(runner) {
                  if (typeof window !== "undefined" && window.cancelAnimationFrame) {
                    window.cancelAnimationFrame(runner.frameRequestId);
                  } else {
                    throw new Error("Matter.Runner: missing required global window.cancelAnimationFrame.");
                  }
                };
                var _mean = function(values) {
                  var result = 0, valuesLength = values.length;
                  for (var i = 0; i < valuesLength; i += 1) {
                    result += values[i];
                  }
                  return result / valuesLength || 0;
                };
              })();
            }),
            /* 28 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var SAT = {};
              module2.exports = SAT;
              var Collision = __webpack_require__(8);
              var Common = __webpack_require__(0);
              var deprecated = Common.deprecated;
              (function() {
                SAT.collides = function(bodyA, bodyB) {
                  return Collision.collides(bodyA, bodyB);
                };
                deprecated(SAT, "collides", "SAT.collides \u27A4 replaced by Collision.collides");
              })();
            }),
            /* 29 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var Svg = {};
              module2.exports = Svg;
              var Bounds = __webpack_require__(1);
              var Common = __webpack_require__(0);
              (function() {
                Svg.pathToVertices = function(path, sampleLength) {
                  if (typeof window !== "undefined" && !("SVGPathSeg" in window)) {
                    Common.warn("Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.");
                  }
                  var i, il, total, point, segment, segments, segmentsQueue, lastSegment, lastPoint, segmentIndex, points = [], lx, ly, length3 = 0, x = 0, y = 0;
                  sampleLength = sampleLength || 15;
                  var addPoint = function(px, py, pathSegType) {
                    var isRelative = pathSegType % 2 === 1 && pathSegType > 1;
                    if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
                      if (lastPoint && isRelative) {
                        lx = lastPoint.x;
                        ly = lastPoint.y;
                      } else {
                        lx = 0;
                        ly = 0;
                      }
                      var point2 = {
                        x: lx + px,
                        y: ly + py
                      };
                      if (isRelative || !lastPoint) {
                        lastPoint = point2;
                      }
                      points.push(point2);
                      x = lx + px;
                      y = ly + py;
                    }
                  };
                  var addSegmentPoint = function(segment2) {
                    var segType = segment2.pathSegTypeAsLetter.toUpperCase();
                    if (segType === "Z")
                      return;
                    switch (segType) {
                      case "M":
                      case "L":
                      case "T":
                      case "C":
                      case "S":
                      case "Q":
                        x = segment2.x;
                        y = segment2.y;
                        break;
                      case "H":
                        x = segment2.x;
                        break;
                      case "V":
                        y = segment2.y;
                        break;
                    }
                    addPoint(x, y, segment2.pathSegType);
                  };
                  Svg._svgPathToAbsolute(path);
                  total = path.getTotalLength();
                  segments = [];
                  for (i = 0; i < path.pathSegList.numberOfItems; i += 1)
                    segments.push(path.pathSegList.getItem(i));
                  segmentsQueue = segments.concat();
                  while (length3 < total) {
                    segmentIndex = path.getPathSegAtLength(length3);
                    segment = segments[segmentIndex];
                    if (segment != lastSegment) {
                      while (segmentsQueue.length && segmentsQueue[0] != segment)
                        addSegmentPoint(segmentsQueue.shift());
                      lastSegment = segment;
                    }
                    switch (segment.pathSegTypeAsLetter.toUpperCase()) {
                      case "C":
                      case "T":
                      case "S":
                      case "Q":
                      case "A":
                        point = path.getPointAtLength(length3);
                        addPoint(point.x, point.y, 0);
                        break;
                    }
                    length3 += sampleLength;
                  }
                  for (i = 0, il = segmentsQueue.length; i < il; ++i)
                    addSegmentPoint(segmentsQueue[i]);
                  return points;
                };
                Svg._svgPathToAbsolute = function(path) {
                  var x0, y0, x1, y1, x2, y2, segs = path.pathSegList, x = 0, y = 0, len = segs.numberOfItems;
                  for (var i = 0; i < len; ++i) {
                    var seg = segs.getItem(i), segType = seg.pathSegTypeAsLetter;
                    if (/[MLHVCSQTA]/.test(segType)) {
                      if ("x" in seg) x = seg.x;
                      if ("y" in seg) y = seg.y;
                    } else {
                      if ("x1" in seg) x1 = x + seg.x1;
                      if ("x2" in seg) x2 = x + seg.x2;
                      if ("y1" in seg) y1 = y + seg.y1;
                      if ("y2" in seg) y2 = y + seg.y2;
                      if ("x" in seg) x += seg.x;
                      if ("y" in seg) y += seg.y;
                      switch (segType) {
                        case "m":
                          segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                          break;
                        case "l":
                          segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                          break;
                        case "h":
                          segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                          break;
                        case "v":
                          segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                          break;
                        case "c":
                          segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                          break;
                        case "s":
                          segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                          break;
                        case "q":
                          segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                          break;
                        case "t":
                          segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                          break;
                        case "a":
                          segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
                          break;
                        case "z":
                        case "Z":
                          x = x0;
                          y = y0;
                          break;
                      }
                    }
                    if (segType == "M" || segType == "m") {
                      x0 = x;
                      y0 = y;
                    }
                  }
                };
              })();
            }),
            /* 30 */
            /***/
            (function(module2, exports2, __webpack_require__) {
              var World2 = {};
              module2.exports = World2;
              var Composite = __webpack_require__(6);
              var Common = __webpack_require__(0);
              (function() {
                World2.create = Composite.create;
                World2.add = Composite.add;
                World2.remove = Composite.remove;
                World2.clear = Composite.clear;
                World2.addComposite = Composite.addComposite;
                World2.addBody = Composite.addBody;
                World2.addConstraint = Composite.addConstraint;
              })();
            })
            /******/
          ])
        );
      });
    }
  });
  var Loader = class {
    listeners = {};
    assets = {};
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
      return this;
    }
    off(event, callback) {
      const list = this.listeners[event];
      if (!list) return this;
      const idx = list.indexOf(callback);
      if (idx !== -1) list.splice(idx, 1);
      return this;
    }
    emit(event, payload) {
      const list = this.listeners[event];
      list?.forEach((cb) => cb(payload));
    }
    async load(assets) {
      this.emit("load", { assets });
      const entries = Object.entries(assets);
      await Promise.all(
        entries.map(([key, src]) => {
          this.emit("loading", { key, src });
          return this.loadAsset(key, src);
        })
      );
      this.emit("complete", { assets: this.assets });
      return this.assets;
    }
    loadAsset(key, src) {
      return new Promise((resolve) => {
        const ext = src.split(".").pop()?.toLowerCase() ?? "";
        const isVideo = ["mp4", "webm", "ogg"].includes(ext);
        if (isVideo) {
          fetch(src).then((res) => res.blob()).then((blob) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(blob);
            video.preload = "auto";
            video.playsInline = true;
            video.onloadeddata = () => {
              this.assets[key] = video;
              this.emit("loaded", { key, asset: video });
              resolve();
            };
            video.onerror = () => {
              const error = new Error(`Failed to load video: ${src}`);
              this.emit("error", { key, src, error });
              resolve();
            };
          }).catch(() => {
            const error = new Error(`Failed to fetch video: ${src}`);
            this.emit("error", { key, src, error });
            resolve();
          });
        } else {
          const image = new Image();
          image.src = src;
          image.onload = () => {
            this.assets[key] = image;
            this.emit("loaded", { key, asset: image });
            resolve();
          };
          image.onerror = () => {
            const error = new Error(`Failed to load image: ${src}`);
            this.emit("error", { key, src, error });
            resolve();
          };
        }
      });
    }
  };
  function v4() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join("")
    ].join("-");
  }
  function length(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function distance(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function squaredDistance(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return x * x + y * y + z * z;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2];
    let bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp(out, a, b, t) {
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function smoothLerp(out, a, b, decay, dt) {
    const exp = Math.exp(-decay * dt);
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = b[0] + (ax - b[0]) * exp;
    out[1] = b[1] + (ay - b[1]) * exp;
    out[2] = b[2] + (az - b[2]) * exp;
    return out;
  }
  function transformMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function scaleRotateMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z) / w;
    return out;
  }
  function transformMat3(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat(out, a, q) {
    let x = a[0], y = a[1], z = a[2];
    let qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    let uvx = qy * z - qz * y;
    let uvy = qz * x - qx * z;
    let uvz = qx * y - qy * x;
    let uuvx = qy * uvz - qz * uvy;
    let uuvy = qz * uvx - qx * uvz;
    let uuvz = qx * uvy - qy * uvx;
    let w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2;
    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2;
    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
  }
  var angle = /* @__PURE__ */ (function() {
    const tempA = [0, 0, 0];
    const tempB = [0, 0, 0];
    return function(a, b) {
      copy(tempA, a);
      copy(tempB, b);
      normalize(tempA, tempA);
      normalize(tempB, tempB);
      let cosine = dot(tempA, tempB);
      if (cosine > 1) {
        return 0;
      } else if (cosine < -1) {
        return Math.PI;
      } else {
        return Math.acos(cosine);
      }
    };
  })();
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  var Vec3 = class _Vec3 extends Array {
    constructor(x = 0, y = x, z = x) {
      super(x, y, z);
      return this;
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    set x(v) {
      this[0] = v;
    }
    set y(v) {
      this[1] = v;
    }
    set z(v) {
      this[2] = v;
    }
    set(x, y = x, z = x) {
      if (x.length) return this.copy(x);
      set(this, x, y, z);
      return this;
    }
    copy(v) {
      copy(this, v);
      return this;
    }
    add(va, vb) {
      if (vb) add(this, va, vb);
      else add(this, this, va);
      return this;
    }
    sub(va, vb) {
      if (vb) subtract(this, va, vb);
      else subtract(this, this, va);
      return this;
    }
    multiply(v) {
      if (v.length) multiply(this, this, v);
      else scale(this, this, v);
      return this;
    }
    divide(v) {
      if (v.length) divide(this, this, v);
      else scale(this, this, 1 / v);
      return this;
    }
    inverse(v = this) {
      inverse(this, v);
      return this;
    }
    // Can't use 'length' as Array.prototype uses it
    len() {
      return length(this);
    }
    distance(v) {
      if (v) return distance(this, v);
      else return length(this);
    }
    squaredLen() {
      return squaredLength(this);
    }
    squaredDistance(v) {
      if (v) return squaredDistance(this, v);
      else return squaredLength(this);
    }
    negate(v = this) {
      negate(this, v);
      return this;
    }
    cross(va, vb) {
      if (vb) cross(this, va, vb);
      else cross(this, this, va);
      return this;
    }
    scale(v) {
      scale(this, this, v);
      return this;
    }
    normalize() {
      normalize(this, this);
      return this;
    }
    dot(v) {
      return dot(this, v);
    }
    equals(v) {
      return exactEquals(this, v);
    }
    applyMatrix3(mat3) {
      transformMat3(this, this, mat3);
      return this;
    }
    applyMatrix4(mat4) {
      transformMat4(this, this, mat4);
      return this;
    }
    scaleRotateMatrix4(mat4) {
      scaleRotateMat4(this, this, mat4);
      return this;
    }
    applyQuaternion(q) {
      transformQuat(this, this, q);
      return this;
    }
    angle(v) {
      return angle(this, v);
    }
    lerp(v, t) {
      lerp(this, this, v, t);
      return this;
    }
    smoothLerp(v, decay, dt) {
      smoothLerp(this, this, v, decay, dt);
      return this;
    }
    clone() {
      return new _Vec3(this[0], this[1], this[2]);
    }
    fromArray(a, o = 0) {
      this[0] = a[o];
      this[1] = a[o + 1];
      this[2] = a[o + 2];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      return a;
    }
    transformDirection(mat4) {
      const x = this[0];
      const y = this[1];
      const z = this[2];
      this[0] = mat4[0] * x + mat4[4] * y + mat4[8] * z;
      this[1] = mat4[1] * x + mat4[5] * y + mat4[9] * z;
      this[2] = mat4[2] * x + mat4[6] * y + mat4[10] * z;
      return this.normalize();
    }
  };
  var tempVec3 = /* @__PURE__ */ new Vec3();
  var ID = 1;
  var ATTR_ID = 1;
  var isBoundsWarned = false;
  var Geometry = class {
    constructor(gl, attributes = {}) {
      if (!gl.canvas) console.error("gl not passed as first argument to Geometry");
      this.gl = gl;
      this.attributes = attributes;
      this.id = ID++;
      this.VAOs = {};
      this.drawRange = { start: 0, count: 0 };
      this.instancedCount = 0;
      this.gl.renderer.bindVertexArray(null);
      this.gl.renderer.currentGeometry = null;
      this.glState = this.gl.renderer.state;
      for (let key in attributes) {
        this.addAttribute(key, attributes[key]);
      }
    }
    addAttribute(key, attr) {
      this.attributes[key] = attr;
      attr.id = ATTR_ID++;
      attr.size = attr.size || 1;
      attr.type = attr.type || (attr.data.constructor === Float32Array ? this.gl.FLOAT : attr.data.constructor === Uint16Array ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT);
      attr.target = key === "index" ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
      attr.normalized = attr.normalized || false;
      attr.stride = attr.stride || 0;
      attr.offset = attr.offset || 0;
      attr.count = attr.count || (attr.stride ? attr.data.byteLength / attr.stride : attr.data.length / attr.size);
      attr.divisor = attr.instanced || 0;
      attr.needsUpdate = false;
      attr.usage = attr.usage || this.gl.STATIC_DRAW;
      if (!attr.buffer) {
        this.updateAttribute(attr);
      }
      if (attr.divisor) {
        this.isInstanced = true;
        if (this.instancedCount && this.instancedCount !== attr.count * attr.divisor) {
          console.warn("geometry has multiple instanced buffers of different length");
          return this.instancedCount = Math.min(this.instancedCount, attr.count * attr.divisor);
        }
        this.instancedCount = attr.count * attr.divisor;
      } else if (key === "index") {
        this.drawRange.count = attr.count;
      } else if (!this.attributes.index) {
        this.drawRange.count = Math.max(this.drawRange.count, attr.count);
      }
    }
    updateAttribute(attr) {
      const isNewBuffer = !attr.buffer;
      if (isNewBuffer) attr.buffer = this.gl.createBuffer();
      if (this.glState.boundBuffer !== attr.buffer) {
        this.gl.bindBuffer(attr.target, attr.buffer);
        this.glState.boundBuffer = attr.buffer;
      }
      if (isNewBuffer) {
        this.gl.bufferData(attr.target, attr.data, attr.usage);
      } else {
        this.gl.bufferSubData(attr.target, 0, attr.data);
      }
      attr.needsUpdate = false;
    }
    setIndex(value) {
      this.addAttribute("index", value);
    }
    setDrawRange(start, count) {
      this.drawRange.start = start;
      this.drawRange.count = count;
    }
    setInstancedCount(value) {
      this.instancedCount = value;
    }
    createVAO(program) {
      this.VAOs[program.attributeOrder] = this.gl.renderer.createVertexArray();
      this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
      this.bindAttributes(program);
    }
    bindAttributes(program) {
      program.attributeLocations.forEach((location, { name, type }) => {
        if (!this.attributes[name]) {
          console.warn(`active attribute ${name} not being supplied`);
          return;
        }
        const attr = this.attributes[name];
        this.gl.bindBuffer(attr.target, attr.buffer);
        this.glState.boundBuffer = attr.buffer;
        let numLoc = 1;
        if (type === 35674) numLoc = 2;
        if (type === 35675) numLoc = 3;
        if (type === 35676) numLoc = 4;
        const size = attr.size / numLoc;
        const stride = numLoc === 1 ? 0 : numLoc * numLoc * 4;
        const offset = numLoc === 1 ? 0 : numLoc * 4;
        for (let i = 0; i < numLoc; i++) {
          this.gl.vertexAttribPointer(location + i, size, attr.type, attr.normalized, attr.stride + stride, attr.offset + i * offset);
          this.gl.enableVertexAttribArray(location + i);
          this.gl.renderer.vertexAttribDivisor(location + i, attr.divisor);
        }
      });
      if (this.attributes.index) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
    }
    draw({ program, mode = this.gl.TRIANGLES }) {
      if (this.gl.renderer.currentGeometry !== `${this.id}_${program.attributeOrder}`) {
        if (!this.VAOs[program.attributeOrder]) this.createVAO(program);
        this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
        this.gl.renderer.currentGeometry = `${this.id}_${program.attributeOrder}`;
      }
      program.attributeLocations.forEach((location, { name }) => {
        const attr = this.attributes[name];
        if (attr.needsUpdate) this.updateAttribute(attr);
      });
      let indexBytesPerElement = 2;
      if (this.attributes.index?.type === this.gl.UNSIGNED_INT) indexBytesPerElement = 4;
      if (this.isInstanced) {
        if (this.attributes.index) {
          this.gl.renderer.drawElementsInstanced(
            mode,
            this.drawRange.count,
            this.attributes.index.type,
            this.attributes.index.offset + this.drawRange.start * indexBytesPerElement,
            this.instancedCount
          );
        } else {
          this.gl.renderer.drawArraysInstanced(mode, this.drawRange.start, this.drawRange.count, this.instancedCount);
        }
      } else {
        if (this.attributes.index) {
          this.gl.drawElements(
            mode,
            this.drawRange.count,
            this.attributes.index.type,
            this.attributes.index.offset + this.drawRange.start * indexBytesPerElement
          );
        } else {
          this.gl.drawArrays(mode, this.drawRange.start, this.drawRange.count);
        }
      }
    }
    getPosition() {
      const attr = this.attributes.position;
      if (attr.data) return attr;
      if (isBoundsWarned) return;
      console.warn("No position buffer data found to compute bounds");
      return isBoundsWarned = true;
    }
    computeBoundingBox(attr) {
      if (!attr) attr = this.getPosition();
      const array = attr.data;
      const stride = attr.size;
      if (!this.bounds) {
        this.bounds = {
          min: new Vec3(),
          max: new Vec3(),
          center: new Vec3(),
          scale: new Vec3(),
          radius: Infinity
        };
      }
      const min = this.bounds.min;
      const max = this.bounds.max;
      const center = this.bounds.center;
      const scale5 = this.bounds.scale;
      min.set(Infinity);
      max.set(-Infinity);
      for (let i = 0, l = array.length; i < l; i += stride) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];
        min.x = Math.min(x, min.x);
        min.y = Math.min(y, min.y);
        min.z = Math.min(z, min.z);
        max.x = Math.max(x, max.x);
        max.y = Math.max(y, max.y);
        max.z = Math.max(z, max.z);
      }
      scale5.sub(max, min);
      center.add(min, max).divide(2);
    }
    computeBoundingSphere(attr) {
      if (!attr) attr = this.getPosition();
      const array = attr.data;
      const stride = attr.size;
      if (!this.bounds) this.computeBoundingBox(attr);
      let maxRadiusSq = 0;
      for (let i = 0, l = array.length; i < l; i += stride) {
        tempVec3.fromArray(array, i);
        maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistance(tempVec3));
      }
      this.bounds.radius = Math.sqrt(maxRadiusSq);
    }
    remove() {
      for (let key in this.VAOs) {
        this.gl.renderer.deleteVertexArray(this.VAOs[key]);
        delete this.VAOs[key];
      }
      for (let key in this.attributes) {
        this.gl.deleteBuffer(this.attributes[key].buffer);
        delete this.attributes[key];
      }
    }
  };
  var ID2 = 1;
  var arrayCacheF32 = {};
  var Program = class {
    constructor(gl, {
      vertex,
      fragment,
      uniforms = {},
      transparent = false,
      cullFace = gl.BACK,
      frontFace = gl.CCW,
      depthTest = true,
      depthWrite = true,
      depthFunc = gl.LEQUAL
    } = {}) {
      if (!gl.canvas) console.error("gl not passed as first argument to Program");
      this.gl = gl;
      this.uniforms = uniforms;
      this.id = ID2++;
      if (!vertex) console.warn("vertex shader not supplied");
      if (!fragment) console.warn("fragment shader not supplied");
      this.transparent = transparent;
      this.cullFace = cullFace;
      this.frontFace = frontFace;
      this.depthTest = depthTest;
      this.depthWrite = depthWrite;
      this.depthFunc = depthFunc;
      this.blendFunc = {};
      this.blendEquation = {};
      this.stencilFunc = {};
      this.stencilOp = {};
      if (this.transparent && !this.blendFunc.src) {
        if (this.gl.renderer.premultipliedAlpha) this.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        else this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      }
      this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
      this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      this.program = gl.createProgram();
      gl.attachShader(this.program, this.vertexShader);
      gl.attachShader(this.program, this.fragmentShader);
      this.setShaders({ vertex, fragment });
    }
    setShaders({ vertex, fragment }) {
      if (vertex) {
        this.gl.shaderSource(this.vertexShader, vertex);
        this.gl.compileShader(this.vertexShader);
        if (this.gl.getShaderInfoLog(this.vertexShader) !== "") {
          console.warn(`${this.gl.getShaderInfoLog(this.vertexShader)}
Vertex Shader
${addLineNumbers(vertex)}`);
        }
      }
      if (fragment) {
        this.gl.shaderSource(this.fragmentShader, fragment);
        this.gl.compileShader(this.fragmentShader);
        if (this.gl.getShaderInfoLog(this.fragmentShader) !== "") {
          console.warn(`${this.gl.getShaderInfoLog(this.fragmentShader)}
Fragment Shader
${addLineNumbers(fragment)}`);
        }
      }
      this.gl.linkProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        return console.warn(this.gl.getProgramInfoLog(this.program));
      }
      this.uniformLocations = /* @__PURE__ */ new Map();
      let numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
      for (let uIndex = 0; uIndex < numUniforms; uIndex++) {
        let uniform = this.gl.getActiveUniform(this.program, uIndex);
        this.uniformLocations.set(uniform, this.gl.getUniformLocation(this.program, uniform.name));
        const split = uniform.name.match(/(\w+)/g);
        uniform.uniformName = split[0];
        uniform.nameComponents = split.slice(1);
      }
      this.attributeLocations = /* @__PURE__ */ new Map();
      const locations = [];
      const numAttribs = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
      for (let aIndex = 0; aIndex < numAttribs; aIndex++) {
        const attribute = this.gl.getActiveAttrib(this.program, aIndex);
        const location = this.gl.getAttribLocation(this.program, attribute.name);
        if (location === -1) continue;
        locations[location] = attribute.name;
        this.attributeLocations.set(attribute, location);
      }
      this.attributeOrder = locations.join("");
    }
    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
      this.blendFunc.src = src;
      this.blendFunc.dst = dst;
      this.blendFunc.srcAlpha = srcAlpha;
      this.blendFunc.dstAlpha = dstAlpha;
      if (src) this.transparent = true;
    }
    setBlendEquation(modeRGB, modeAlpha) {
      this.blendEquation.modeRGB = modeRGB;
      this.blendEquation.modeAlpha = modeAlpha;
    }
    setStencilFunc(func, ref, mask) {
      this.stencilRef = ref;
      this.stencilFunc.func = func;
      this.stencilFunc.ref = ref;
      this.stencilFunc.mask = mask;
    }
    setStencilOp(stencilFail, depthFail, depthPass) {
      this.stencilOp.stencilFail = stencilFail;
      this.stencilOp.depthFail = depthFail;
      this.stencilOp.depthPass = depthPass;
    }
    applyState() {
      if (this.depthTest) this.gl.renderer.enable(this.gl.DEPTH_TEST);
      else this.gl.renderer.disable(this.gl.DEPTH_TEST);
      if (this.cullFace) this.gl.renderer.enable(this.gl.CULL_FACE);
      else this.gl.renderer.disable(this.gl.CULL_FACE);
      if (this.blendFunc.src) this.gl.renderer.enable(this.gl.BLEND);
      else this.gl.renderer.disable(this.gl.BLEND);
      if (this.cullFace) this.gl.renderer.setCullFace(this.cullFace);
      this.gl.renderer.setFrontFace(this.frontFace);
      this.gl.renderer.setDepthMask(this.depthWrite);
      this.gl.renderer.setDepthFunc(this.depthFunc);
      if (this.blendFunc.src) this.gl.renderer.setBlendFunc(this.blendFunc.src, this.blendFunc.dst, this.blendFunc.srcAlpha, this.blendFunc.dstAlpha);
      this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB, this.blendEquation.modeAlpha);
      if (this.stencilFunc.func || this.stencilOp.stencilFail) this.gl.renderer.enable(this.gl.STENCIL_TEST);
      else this.gl.renderer.disable(this.gl.STENCIL_TEST);
      this.gl.renderer.setStencilFunc(this.stencilFunc.func, this.stencilFunc.ref, this.stencilFunc.mask);
      this.gl.renderer.setStencilOp(this.stencilOp.stencilFail, this.stencilOp.depthFail, this.stencilOp.depthPass);
    }
    use({ flipFaces = false } = {}) {
      let textureUnit = -1;
      const programActive = this.gl.renderer.state.currentProgram === this.id;
      if (!programActive) {
        this.gl.useProgram(this.program);
        this.gl.renderer.state.currentProgram = this.id;
      }
      this.uniformLocations.forEach((location, activeUniform) => {
        let uniform = this.uniforms[activeUniform.uniformName];
        for (const component of activeUniform.nameComponents) {
          if (!uniform) break;
          if (component in uniform) {
            uniform = uniform[component];
          } else if (Array.isArray(uniform.value)) {
            break;
          } else {
            uniform = void 0;
            break;
          }
        }
        if (!uniform) {
          return warn(`Active uniform ${activeUniform.name} has not been supplied`);
        }
        if (uniform && uniform.value === void 0) {
          return warn(`${activeUniform.name} uniform is missing a value parameter`);
        }
        if (uniform.value.texture) {
          textureUnit = textureUnit + 1;
          uniform.value.update(textureUnit);
          return setUniform(this.gl, activeUniform.type, location, textureUnit);
        }
        if (uniform.value.length && uniform.value[0].texture) {
          const textureUnits = [];
          uniform.value.forEach((value) => {
            textureUnit = textureUnit + 1;
            value.update(textureUnit);
            textureUnits.push(textureUnit);
          });
          return setUniform(this.gl, activeUniform.type, location, textureUnits);
        }
        setUniform(this.gl, activeUniform.type, location, uniform.value);
      });
      this.applyState();
      if (flipFaces) this.gl.renderer.setFrontFace(this.frontFace === this.gl.CCW ? this.gl.CW : this.gl.CCW);
    }
    remove() {
      this.gl.deleteProgram(this.program);
    }
  };
  function setUniform(gl, type, location, value) {
    value = value.length ? flatten(value) : value;
    const setValue = gl.renderer.state.uniformLocations.get(location);
    if (value.length) {
      if (setValue === void 0 || setValue.length !== value.length) {
        gl.renderer.state.uniformLocations.set(location, value.slice(0));
      } else {
        if (arraysEqual(setValue, value)) return;
        setValue.set ? setValue.set(value) : setArray(setValue, value);
        gl.renderer.state.uniformLocations.set(location, setValue);
      }
    } else {
      if (setValue === value) return;
      gl.renderer.state.uniformLocations.set(location, value);
    }
    switch (type) {
      case 5126:
        return value.length ? gl.uniform1fv(location, value) : gl.uniform1f(location, value);
      // FLOAT
      case 35664:
        return gl.uniform2fv(location, value);
      // FLOAT_VEC2
      case 35665:
        return gl.uniform3fv(location, value);
      // FLOAT_VEC3
      case 35666:
        return gl.uniform4fv(location, value);
      // FLOAT_VEC4
      case 35670:
      // BOOL
      case 5124:
      // INT
      case 35678:
      // SAMPLER_2D
      case 36306:
      // U_SAMPLER_2D
      case 35680:
      // SAMPLER_CUBE
      case 36289:
        return value.length ? gl.uniform1iv(location, value) : gl.uniform1i(location, value);
      // SAMPLER_CUBE
      case 35671:
      // BOOL_VEC2
      case 35667:
        return gl.uniform2iv(location, value);
      // INT_VEC2
      case 35672:
      // BOOL_VEC3
      case 35668:
        return gl.uniform3iv(location, value);
      // INT_VEC3
      case 35673:
      // BOOL_VEC4
      case 35669:
        return gl.uniform4iv(location, value);
      // INT_VEC4
      case 35674:
        return gl.uniformMatrix2fv(location, false, value);
      // FLOAT_MAT2
      case 35675:
        return gl.uniformMatrix3fv(location, false, value);
      // FLOAT_MAT3
      case 35676:
        return gl.uniformMatrix4fv(location, false, value);
    }
  }
  function addLineNumbers(string) {
    let lines = string.split("\n");
    for (let i = 0; i < lines.length; i++) {
      lines[i] = i + 1 + ": " + lines[i];
    }
    return lines.join("\n");
  }
  function flatten(a) {
    const arrayLen = a.length;
    const valueLen = a[0].length;
    if (valueLen === void 0) return a;
    const length3 = arrayLen * valueLen;
    let value = arrayCacheF32[length3];
    if (!value) arrayCacheF32[length3] = value = new Float32Array(length3);
    for (let i = 0; i < arrayLen; i++) value.set(a[i], i * valueLen);
    return value;
  }
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0, l = a.length; i < l; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  function setArray(a, b) {
    for (let i = 0, l = a.length; i < l; i++) {
      a[i] = b[i];
    }
  }
  var warnCount = 0;
  function warn(message) {
    if (warnCount > 100) return;
    console.warn(message);
    warnCount++;
    if (warnCount > 100) console.warn("More than 100 program warnings - stopping logs.");
  }
  var tempVec32 = /* @__PURE__ */ new Vec3();
  var ID3 = 1;
  var Renderer = class {
    constructor({
      canvas = document.createElement("canvas"),
      width = 300,
      height = 150,
      dpr = 1,
      alpha = false,
      depth = true,
      stencil = false,
      antialias = false,
      premultipliedAlpha = false,
      preserveDrawingBuffer = false,
      powerPreference = "default",
      autoClear = true,
      webgl = 2
    } = {}) {
      const attributes = { alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference };
      this.dpr = dpr;
      this.alpha = alpha;
      this.color = true;
      this.depth = depth;
      this.stencil = stencil;
      this.premultipliedAlpha = premultipliedAlpha;
      this.autoClear = autoClear;
      this.id = ID3++;
      if (webgl === 2) this.gl = canvas.getContext("webgl2", attributes);
      this.isWebgl2 = !!this.gl;
      if (!this.gl) this.gl = canvas.getContext("webgl", attributes);
      if (!this.gl) console.error("unable to create webgl context");
      this.gl.renderer = this;
      this.setSize(width, height);
      this.state = {};
      this.state.blendFunc = { src: this.gl.ONE, dst: this.gl.ZERO };
      this.state.blendEquation = { modeRGB: this.gl.FUNC_ADD };
      this.state.cullFace = false;
      this.state.frontFace = this.gl.CCW;
      this.state.depthMask = true;
      this.state.depthFunc = this.gl.LEQUAL;
      this.state.premultiplyAlpha = false;
      this.state.flipY = false;
      this.state.unpackAlignment = 4;
      this.state.framebuffer = null;
      this.state.viewport = { x: 0, y: 0, width: null, height: null };
      this.state.textureUnits = [];
      this.state.activeTextureUnit = 0;
      this.state.boundBuffer = null;
      this.state.uniformLocations = /* @__PURE__ */ new Map();
      this.state.currentProgram = null;
      this.extensions = {};
      if (this.isWebgl2) {
        this.getExtension("EXT_color_buffer_float");
        this.getExtension("OES_texture_float_linear");
      } else {
        this.getExtension("OES_texture_float");
        this.getExtension("OES_texture_float_linear");
        this.getExtension("OES_texture_half_float");
        this.getExtension("OES_texture_half_float_linear");
        this.getExtension("OES_element_index_uint");
        this.getExtension("OES_standard_derivatives");
        this.getExtension("EXT_sRGB");
        this.getExtension("WEBGL_depth_texture");
        this.getExtension("WEBGL_draw_buffers");
      }
      this.getExtension("WEBGL_compressed_texture_astc");
      this.getExtension("EXT_texture_compression_bptc");
      this.getExtension("WEBGL_compressed_texture_s3tc");
      this.getExtension("WEBGL_compressed_texture_etc1");
      this.getExtension("WEBGL_compressed_texture_pvrtc");
      this.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
      this.vertexAttribDivisor = this.getExtension("ANGLE_instanced_arrays", "vertexAttribDivisor", "vertexAttribDivisorANGLE");
      this.drawArraysInstanced = this.getExtension("ANGLE_instanced_arrays", "drawArraysInstanced", "drawArraysInstancedANGLE");
      this.drawElementsInstanced = this.getExtension("ANGLE_instanced_arrays", "drawElementsInstanced", "drawElementsInstancedANGLE");
      this.createVertexArray = this.getExtension("OES_vertex_array_object", "createVertexArray", "createVertexArrayOES");
      this.bindVertexArray = this.getExtension("OES_vertex_array_object", "bindVertexArray", "bindVertexArrayOES");
      this.deleteVertexArray = this.getExtension("OES_vertex_array_object", "deleteVertexArray", "deleteVertexArrayOES");
      this.drawBuffers = this.getExtension("WEBGL_draw_buffers", "drawBuffers", "drawBuffersWEBGL");
      this.parameters = {};
      this.parameters.maxTextureUnits = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      this.parameters.maxAnisotropy = this.getExtension("EXT_texture_filter_anisotropic") ? this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    }
    setSize(width, height) {
      this.width = width;
      this.height = height;
      this.gl.canvas.width = width * this.dpr;
      this.gl.canvas.height = height * this.dpr;
      if (!this.gl.canvas.style) return;
      Object.assign(this.gl.canvas.style, {
        width: width + "px",
        height: height + "px"
      });
    }
    setViewport(width, height, x = 0, y = 0) {
      if (this.state.viewport.width === width && this.state.viewport.height === height) return;
      this.state.viewport.width = width;
      this.state.viewport.height = height;
      this.state.viewport.x = x;
      this.state.viewport.y = y;
      this.gl.viewport(x, y, width, height);
    }
    setScissor(width, height, x = 0, y = 0) {
      this.gl.scissor(x, y, width, height);
    }
    enable(id) {
      if (this.state[id] === true) return;
      this.gl.enable(id);
      this.state[id] = true;
    }
    disable(id) {
      if (this.state[id] === false) return;
      this.gl.disable(id);
      this.state[id] = false;
    }
    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
      if (this.state.blendFunc.src === src && this.state.blendFunc.dst === dst && this.state.blendFunc.srcAlpha === srcAlpha && this.state.blendFunc.dstAlpha === dstAlpha)
        return;
      this.state.blendFunc.src = src;
      this.state.blendFunc.dst = dst;
      this.state.blendFunc.srcAlpha = srcAlpha;
      this.state.blendFunc.dstAlpha = dstAlpha;
      if (srcAlpha !== void 0) this.gl.blendFuncSeparate(src, dst, srcAlpha, dstAlpha);
      else this.gl.blendFunc(src, dst);
    }
    setBlendEquation(modeRGB, modeAlpha) {
      modeRGB = modeRGB || this.gl.FUNC_ADD;
      if (this.state.blendEquation.modeRGB === modeRGB && this.state.blendEquation.modeAlpha === modeAlpha) return;
      this.state.blendEquation.modeRGB = modeRGB;
      this.state.blendEquation.modeAlpha = modeAlpha;
      if (modeAlpha !== void 0) this.gl.blendEquationSeparate(modeRGB, modeAlpha);
      else this.gl.blendEquation(modeRGB);
    }
    setCullFace(value) {
      if (this.state.cullFace === value) return;
      this.state.cullFace = value;
      this.gl.cullFace(value);
    }
    setFrontFace(value) {
      if (this.state.frontFace === value) return;
      this.state.frontFace = value;
      this.gl.frontFace(value);
    }
    setDepthMask(value) {
      if (this.state.depthMask === value) return;
      this.state.depthMask = value;
      this.gl.depthMask(value);
    }
    setDepthFunc(value) {
      if (this.state.depthFunc === value) return;
      this.state.depthFunc = value;
      this.gl.depthFunc(value);
    }
    setStencilMask(value) {
      if (this.state.stencilMask === value) return;
      this.state.stencilMask = value;
      this.gl.stencilMask(value);
    }
    setStencilFunc(func, ref, mask) {
      if (this.state.stencilFunc === func && this.state.stencilRef === ref && this.state.stencilFuncMask === mask) return;
      this.state.stencilFunc = func || this.gl.ALWAYS;
      this.state.stencilRef = ref || 0;
      this.state.stencilFuncMask = mask || 0;
      this.gl.stencilFunc(func || this.gl.ALWAYS, ref || 0, mask || 0);
    }
    setStencilOp(stencilFail, depthFail, depthPass) {
      if (this.state.stencilFail === stencilFail && this.state.stencilDepthFail === depthFail && this.state.stencilDepthPass === depthPass) return;
      this.state.stencilFail = stencilFail;
      this.state.stencilDepthFail = depthFail;
      this.state.stencilDepthPass = depthPass;
      this.gl.stencilOp(stencilFail, depthFail, depthPass);
    }
    activeTexture(value) {
      if (this.state.activeTextureUnit === value) return;
      this.state.activeTextureUnit = value;
      this.gl.activeTexture(this.gl.TEXTURE0 + value);
    }
    bindFramebuffer({ target = this.gl.FRAMEBUFFER, buffer = null } = {}) {
      if (this.state.framebuffer === buffer) return;
      this.state.framebuffer = buffer;
      this.gl.bindFramebuffer(target, buffer);
    }
    getExtension(extension, webgl2Func, extFunc) {
      if (webgl2Func && this.gl[webgl2Func]) return this.gl[webgl2Func].bind(this.gl);
      if (!this.extensions[extension]) {
        this.extensions[extension] = this.gl.getExtension(extension);
      }
      if (!webgl2Func) return this.extensions[extension];
      if (!this.extensions[extension]) return null;
      return this.extensions[extension][extFunc].bind(this.extensions[extension]);
    }
    sortOpaque(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else if (a.program.id !== b.program.id) {
        return a.program.id - b.program.id;
      } else if (a.zDepth !== b.zDepth) {
        return a.zDepth - b.zDepth;
      } else {
        return b.id - a.id;
      }
    }
    sortTransparent(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      }
      if (a.zDepth !== b.zDepth) {
        return b.zDepth - a.zDepth;
      } else {
        return b.id - a.id;
      }
    }
    sortUI(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else if (a.program.id !== b.program.id) {
        return a.program.id - b.program.id;
      } else {
        return b.id - a.id;
      }
    }
    getRenderList({ scene, camera, frustumCull, sort }) {
      let renderList = [];
      if (camera && frustumCull) camera.updateFrustum();
      scene.traverse((node) => {
        if (!node.visible) return true;
        if (!node.draw) return;
        if (frustumCull && node.frustumCulled && camera) {
          if (!camera.frustumIntersectsMesh(node)) return;
        }
        renderList.push(node);
      });
      if (sort) {
        const opaque = [];
        const transparent = [];
        const ui = [];
        renderList.forEach((node) => {
          if (!node.program.transparent) {
            opaque.push(node);
          } else if (node.program.depthTest) {
            transparent.push(node);
          } else {
            ui.push(node);
          }
          node.zDepth = 0;
          if (node.renderOrder !== 0 || !node.program.depthTest || !camera) return;
          node.worldMatrix.getTranslation(tempVec32);
          tempVec32.applyMatrix4(camera.projectionViewMatrix);
          node.zDepth = tempVec32.z;
        });
        opaque.sort(this.sortOpaque);
        transparent.sort(this.sortTransparent);
        ui.sort(this.sortUI);
        renderList = opaque.concat(transparent, ui);
      }
      return renderList;
    }
    render({ scene, camera, target = null, update = true, sort = true, frustumCull = true, clear }) {
      if (target === null) {
        this.bindFramebuffer();
        this.setViewport(this.width * this.dpr, this.height * this.dpr);
      } else {
        this.bindFramebuffer(target);
        this.setViewport(target.width, target.height);
      }
      if (clear || this.autoClear && clear !== false) {
        if (this.depth && (!target || target.depth)) {
          this.enable(this.gl.DEPTH_TEST);
          this.setDepthMask(true);
        }
        if (this.stencil || (!target || target.stencil)) {
          this.enable(this.gl.STENCIL_TEST);
          this.setStencilMask(255);
        }
        this.gl.clear(
          (this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0)
        );
      }
      if (update) scene.updateMatrixWorld();
      if (camera) camera.updateMatrixWorld();
      const renderList = this.getRenderList({ scene, camera, frustumCull, sort });
      renderList.forEach((node) => {
        node.draw({ camera });
      });
    }
  };
  function copy2(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function set2(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function normalize2(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let w = a[3];
    let len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function identity(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  }
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    let s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  function multiply2(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  function rotateX(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
  }
  function rotateY(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let by = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
  }
  function rotateZ(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bz = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
  }
  function slerp(out, a, b, t) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    let omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > 1e-6) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  function invert(out, a) {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    let dot4 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    let invDot = dot4 ? 1 / dot4 : 0;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  }
  function conjugate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  }
  function fromMat3(out, m) {
    let fTrace = m[0] + m[4] + m[8];
    let fRoot;
    if (fTrace > 0) {
      fRoot = Math.sqrt(fTrace + 1);
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      let i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      let j = (i + 1) % 3;
      let k = (i + 2) % 3;
      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }
    return out;
  }
  function fromEuler(out, euler, order = "YXZ") {
    let sx = Math.sin(euler[0] * 0.5);
    let cx = Math.cos(euler[0] * 0.5);
    let sy = Math.sin(euler[1] * 0.5);
    let cy = Math.cos(euler[1] * 0.5);
    let sz = Math.sin(euler[2] * 0.5);
    let cz = Math.cos(euler[2] * 0.5);
    if (order === "XYZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "YXZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "ZXY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "ZYX") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "YZX") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "XZY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    }
    return out;
  }
  var copy3 = copy2;
  var set3 = set2;
  var dot3 = dot2;
  var normalize3 = normalize2;
  var Quat = class extends Array {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      super(x, y, z, w);
      this.onChange = () => {
      };
      this._target = this;
      const triggerProps = ["0", "1", "2", "3"];
      return new Proxy(this, {
        set(target, property) {
          const success = Reflect.set(...arguments);
          if (success && triggerProps.includes(property)) target.onChange();
          return success;
        }
      });
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    get w() {
      return this[3];
    }
    set x(v) {
      this._target[0] = v;
      this.onChange();
    }
    set y(v) {
      this._target[1] = v;
      this.onChange();
    }
    set z(v) {
      this._target[2] = v;
      this.onChange();
    }
    set w(v) {
      this._target[3] = v;
      this.onChange();
    }
    identity() {
      identity(this._target);
      this.onChange();
      return this;
    }
    set(x, y, z, w) {
      if (x.length) return this.copy(x);
      set3(this._target, x, y, z, w);
      this.onChange();
      return this;
    }
    rotateX(a) {
      rotateX(this._target, this._target, a);
      this.onChange();
      return this;
    }
    rotateY(a) {
      rotateY(this._target, this._target, a);
      this.onChange();
      return this;
    }
    rotateZ(a) {
      rotateZ(this._target, this._target, a);
      this.onChange();
      return this;
    }
    inverse(q = this._target) {
      invert(this._target, q);
      this.onChange();
      return this;
    }
    conjugate(q = this._target) {
      conjugate(this._target, q);
      this.onChange();
      return this;
    }
    copy(q) {
      copy3(this._target, q);
      this.onChange();
      return this;
    }
    normalize(q = this._target) {
      normalize3(this._target, q);
      this.onChange();
      return this;
    }
    multiply(qA, qB) {
      if (qB) {
        multiply2(this._target, qA, qB);
      } else {
        multiply2(this._target, this._target, qA);
      }
      this.onChange();
      return this;
    }
    dot(v) {
      return dot3(this._target, v);
    }
    fromMatrix3(matrix3) {
      fromMat3(this._target, matrix3);
      this.onChange();
      return this;
    }
    fromEuler(euler, isInternal) {
      fromEuler(this._target, euler, euler.order);
      if (!isInternal) this.onChange();
      return this;
    }
    fromAxisAngle(axis, a) {
      setAxisAngle(this._target, axis, a);
      this.onChange();
      return this;
    }
    slerp(q, t) {
      slerp(this._target, this._target, q, t);
      this.onChange();
      return this;
    }
    fromArray(a, o = 0) {
      this._target[0] = a[o];
      this._target[1] = a[o + 1];
      this._target[2] = a[o + 2];
      this._target[3] = a[o + 3];
      this.onChange();
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      a[o + 3] = this[3];
      return a;
    }
  };
  var EPSILON = 1e-6;
  function copy4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function set4(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function invert2(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function determinant(a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }
  function multiply3(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale3(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate(out, a, rad, axis) {
    let x = axis[0], y = axis[1], z = axis[2];
    let len = Math.hypot(x, y, z);
    let s, c, t;
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    let b00, b01, b02;
    let b10, b11, b12;
    let b20, b21, b22;
    if (Math.abs(len) < EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function getTranslation(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    out[0] = Math.hypot(m11, m12, m13);
    out[1] = Math.hypot(m21, m22, m23);
    out[2] = Math.hypot(m31, m32, m33);
    return out;
  }
  function getMaxScaleOnAxis(mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    const x = m11 * m11 + m12 * m12 + m13 * m13;
    const y = m21 * m21 + m22 * m22 + m23 * m23;
    const z = m31 * m31 + m32 * m32 + m33 * m33;
    return Math.sqrt(Math.max(x, y, z));
  }
  var getRotation = /* @__PURE__ */ (function() {
    const temp = [1, 1, 1];
    return function(out, mat) {
      let scaling = temp;
      getScaling(scaling, mat);
      let is1 = 1 / scaling[0];
      let is2 = 1 / scaling[1];
      let is3 = 1 / scaling[2];
      let sm11 = mat[0] * is1;
      let sm12 = mat[1] * is2;
      let sm13 = mat[2] * is3;
      let sm21 = mat[4] * is1;
      let sm22 = mat[5] * is2;
      let sm23 = mat[6] * is3;
      let sm31 = mat[8] * is1;
      let sm32 = mat[9] * is2;
      let sm33 = mat[10] * is3;
      let trace = sm11 + sm22 + sm33;
      let S = 0;
      if (trace > 0) {
        S = Math.sqrt(trace + 1) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
      } else if (sm22 > sm33) {
        S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
      } else {
        S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }
      return out;
    };
  })();
  function decompose(srcMat, dstRotation, dstTranslation, dstScale) {
    let sx = length([srcMat[0], srcMat[1], srcMat[2]]);
    const sy = length([srcMat[4], srcMat[5], srcMat[6]]);
    const sz = length([srcMat[8], srcMat[9], srcMat[10]]);
    const det = determinant(srcMat);
    if (det < 0) sx = -sx;
    dstTranslation[0] = srcMat[12];
    dstTranslation[1] = srcMat[13];
    dstTranslation[2] = srcMat[14];
    const _m1 = srcMat.slice();
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;
    _m1[0] *= invSX;
    _m1[1] *= invSX;
    _m1[2] *= invSX;
    _m1[4] *= invSY;
    _m1[5] *= invSY;
    _m1[6] *= invSY;
    _m1[8] *= invSZ;
    _m1[9] *= invSZ;
    _m1[10] *= invSZ;
    getRotation(dstRotation, _m1);
    dstScale[0] = sx;
    dstScale[1] = sy;
    dstScale[2] = sz;
  }
  function compose(dstMat, srcRotation, srcTranslation, srcScale) {
    const te = dstMat;
    const x = srcRotation[0], y = srcRotation[1], z = srcRotation[2], w = srcRotation[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = srcScale[0], sy = srcScale[1], sz = srcScale[2];
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = srcTranslation[0];
    te[13] = srcTranslation[1];
    te[14] = srcTranslation[2];
    te[15] = 1;
    return te;
  }
  function fromQuat(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function perspective(out, fovy, aspect, near, far) {
    let f = 1 / Math.tan(fovy / 2);
    let nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }
  function ortho(out, left, right, bottom, top, near, far) {
    let lr = 1 / (left - right);
    let bt = 1 / (bottom - top);
    let nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    let eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    let z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    let len = z0 * z0 + z1 * z1 + z2 * z2;
    if (len === 0) {
      z2 = 1;
    } else {
      len = 1 / Math.sqrt(len);
      z0 *= len;
      z1 *= len;
      z2 *= len;
    }
    let x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len = x0 * x0 + x1 * x1 + x2 * x2;
    if (len === 0) {
      if (upz) {
        upx += 1e-6;
      } else if (upy) {
        upz += 1e-6;
      } else {
        upy += 1e-6;
      }
      x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;
    }
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function add3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  var Mat4 = class extends Array {
    constructor(m00 = 1, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 1, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 1, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 1) {
      super(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
      return this;
    }
    get x() {
      return this[12];
    }
    get y() {
      return this[13];
    }
    get z() {
      return this[14];
    }
    get w() {
      return this[15];
    }
    set x(v) {
      this[12] = v;
    }
    set y(v) {
      this[13] = v;
    }
    set z(v) {
      this[14] = v;
    }
    set w(v) {
      this[15] = v;
    }
    set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
      if (m00.length) return this.copy(m00);
      set4(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
      return this;
    }
    translate(v, m = this) {
      translate(this, m, v);
      return this;
    }
    rotate(v, axis, m = this) {
      rotate(this, m, v, axis);
      return this;
    }
    scale(v, m = this) {
      scale3(this, m, typeof v === "number" ? [v, v, v] : v);
      return this;
    }
    add(ma, mb) {
      if (mb) add3(this, ma, mb);
      else add3(this, this, ma);
      return this;
    }
    sub(ma, mb) {
      if (mb) subtract2(this, ma, mb);
      else subtract2(this, this, ma);
      return this;
    }
    multiply(ma, mb) {
      if (!ma.length) {
        multiplyScalar(this, this, ma);
      } else if (mb) {
        multiply3(this, ma, mb);
      } else {
        multiply3(this, this, ma);
      }
      return this;
    }
    identity() {
      identity2(this);
      return this;
    }
    copy(m) {
      copy4(this, m);
      return this;
    }
    fromPerspective({ fov, aspect, near, far } = {}) {
      perspective(this, fov, aspect, near, far);
      return this;
    }
    fromOrthogonal({ left, right, bottom, top, near, far }) {
      ortho(this, left, right, bottom, top, near, far);
      return this;
    }
    fromQuaternion(q) {
      fromQuat(this, q);
      return this;
    }
    setPosition(v) {
      this.x = v[0];
      this.y = v[1];
      this.z = v[2];
      return this;
    }
    inverse(m = this) {
      invert2(this, m);
      return this;
    }
    compose(q, pos, scale5) {
      compose(this, q, pos, scale5);
      return this;
    }
    decompose(q, pos, scale5) {
      decompose(this, q, pos, scale5);
      return this;
    }
    getRotation(q) {
      getRotation(q, this);
      return this;
    }
    getTranslation(pos) {
      getTranslation(pos, this);
      return this;
    }
    getScaling(scale5) {
      getScaling(scale5, this);
      return this;
    }
    getMaxScaleOnAxis() {
      return getMaxScaleOnAxis(this);
    }
    lookAt(eye, target, up) {
      targetTo(this, eye, target, up);
      return this;
    }
    determinant() {
      return determinant(this);
    }
    fromArray(a, o = 0) {
      this[0] = a[o];
      this[1] = a[o + 1];
      this[2] = a[o + 2];
      this[3] = a[o + 3];
      this[4] = a[o + 4];
      this[5] = a[o + 5];
      this[6] = a[o + 6];
      this[7] = a[o + 7];
      this[8] = a[o + 8];
      this[9] = a[o + 9];
      this[10] = a[o + 10];
      this[11] = a[o + 11];
      this[12] = a[o + 12];
      this[13] = a[o + 13];
      this[14] = a[o + 14];
      this[15] = a[o + 15];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      a[o + 3] = this[3];
      a[o + 4] = this[4];
      a[o + 5] = this[5];
      a[o + 6] = this[6];
      a[o + 7] = this[7];
      a[o + 8] = this[8];
      a[o + 9] = this[9];
      a[o + 10] = this[10];
      a[o + 11] = this[11];
      a[o + 12] = this[12];
      a[o + 13] = this[13];
      a[o + 14] = this[14];
      a[o + 15] = this[15];
      return a;
    }
  };
  function fromRotationMatrix(out, m, order = "YXZ") {
    if (order === "XYZ") {
      out[1] = Math.asin(Math.min(Math.max(m[8], -1), 1));
      if (Math.abs(m[8]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[10]);
        out[2] = Math.atan2(-m[4], m[0]);
      } else {
        out[0] = Math.atan2(m[6], m[5]);
        out[2] = 0;
      }
    } else if (order === "YXZ") {
      out[0] = Math.asin(-Math.min(Math.max(m[9], -1), 1));
      if (Math.abs(m[9]) < 0.99999) {
        out[1] = Math.atan2(m[8], m[10]);
        out[2] = Math.atan2(m[1], m[5]);
      } else {
        out[1] = Math.atan2(-m[2], m[0]);
        out[2] = 0;
      }
    } else if (order === "ZXY") {
      out[0] = Math.asin(Math.min(Math.max(m[6], -1), 1));
      if (Math.abs(m[6]) < 0.99999) {
        out[1] = Math.atan2(-m[2], m[10]);
        out[2] = Math.atan2(-m[4], m[5]);
      } else {
        out[1] = 0;
        out[2] = Math.atan2(m[1], m[0]);
      }
    } else if (order === "ZYX") {
      out[1] = Math.asin(-Math.min(Math.max(m[2], -1), 1));
      if (Math.abs(m[2]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[10]);
        out[2] = Math.atan2(m[1], m[0]);
      } else {
        out[0] = 0;
        out[2] = Math.atan2(-m[4], m[5]);
      }
    } else if (order === "YZX") {
      out[2] = Math.asin(Math.min(Math.max(m[1], -1), 1));
      if (Math.abs(m[1]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[5]);
        out[1] = Math.atan2(-m[2], m[0]);
      } else {
        out[0] = 0;
        out[1] = Math.atan2(m[8], m[10]);
      }
    } else if (order === "XZY") {
      out[2] = Math.asin(-Math.min(Math.max(m[4], -1), 1));
      if (Math.abs(m[4]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[5]);
        out[1] = Math.atan2(m[8], m[0]);
      } else {
        out[0] = Math.atan2(-m[9], m[10]);
        out[1] = 0;
      }
    }
    return out;
  }
  var tmpMat4 = /* @__PURE__ */ new Mat4();
  var Euler = class extends Array {
    constructor(x = 0, y = x, z = x, order = "YXZ") {
      super(x, y, z);
      this.order = order;
      this.onChange = () => {
      };
      this._target = this;
      const triggerProps = ["0", "1", "2"];
      return new Proxy(this, {
        set(target, property) {
          const success = Reflect.set(...arguments);
          if (success && triggerProps.includes(property)) target.onChange();
          return success;
        }
      });
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    set x(v) {
      this._target[0] = v;
      this.onChange();
    }
    set y(v) {
      this._target[1] = v;
      this.onChange();
    }
    set z(v) {
      this._target[2] = v;
      this.onChange();
    }
    set(x, y = x, z = x) {
      if (x.length) return this.copy(x);
      this._target[0] = x;
      this._target[1] = y;
      this._target[2] = z;
      this.onChange();
      return this;
    }
    copy(v) {
      this._target[0] = v[0];
      this._target[1] = v[1];
      this._target[2] = v[2];
      this.onChange();
      return this;
    }
    reorder(order) {
      this._target.order = order;
      this.onChange();
      return this;
    }
    fromRotationMatrix(m, order = this.order) {
      fromRotationMatrix(this._target, m, order);
      this.onChange();
      return this;
    }
    fromQuaternion(q, order = this.order, isInternal) {
      tmpMat4.fromQuaternion(q);
      this._target.fromRotationMatrix(tmpMat4, order);
      if (!isInternal) this.onChange();
      return this;
    }
    fromArray(a, o = 0) {
      this._target[0] = a[o];
      this._target[1] = a[o + 1];
      this._target[2] = a[o + 2];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      return a;
    }
  };
  var Transform = class {
    constructor() {
      this.parent = null;
      this.children = [];
      this.visible = true;
      this.matrix = new Mat4();
      this.worldMatrix = new Mat4();
      this.matrixAutoUpdate = true;
      this.worldMatrixNeedsUpdate = false;
      this.position = new Vec3();
      this.quaternion = new Quat();
      this.scale = new Vec3(1);
      this.rotation = new Euler();
      this.up = new Vec3(0, 1, 0);
      this.rotation._target.onChange = () => this.quaternion.fromEuler(this.rotation, true);
      this.quaternion._target.onChange = () => this.rotation.fromQuaternion(this.quaternion, void 0, true);
    }
    setParent(parent, notifyParent = true) {
      if (this.parent && parent !== this.parent) this.parent.removeChild(this, false);
      this.parent = parent;
      if (notifyParent && parent) parent.addChild(this, false);
    }
    addChild(child, notifyChild = true) {
      if (!~this.children.indexOf(child)) this.children.push(child);
      if (notifyChild) child.setParent(this, false);
    }
    removeChild(child, notifyChild = true) {
      if (!!~this.children.indexOf(child)) this.children.splice(this.children.indexOf(child), 1);
      if (notifyChild) child.setParent(null, false);
    }
    updateMatrixWorld(force) {
      if (this.matrixAutoUpdate) this.updateMatrix();
      if (this.worldMatrixNeedsUpdate || force) {
        if (this.parent === null) this.worldMatrix.copy(this.matrix);
        else this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix);
        this.worldMatrixNeedsUpdate = false;
        force = true;
      }
      for (let i = 0, l = this.children.length; i < l; i++) {
        this.children[i].updateMatrixWorld(force);
      }
    }
    updateMatrix() {
      this.matrix.compose(this.quaternion, this.position, this.scale);
      this.worldMatrixNeedsUpdate = true;
    }
    traverse(callback) {
      if (callback(this)) return;
      for (let i = 0, l = this.children.length; i < l; i++) {
        this.children[i].traverse(callback);
      }
    }
    decompose() {
      this.matrix.decompose(this.quaternion._target, this.position, this.scale);
      this.rotation.fromQuaternion(this.quaternion);
    }
    lookAt(target, invert4 = false) {
      if (invert4) this.matrix.lookAt(this.position, target, this.up);
      else this.matrix.lookAt(target, this.position, this.up);
      this.matrix.getRotation(this.quaternion._target);
      this.rotation.fromQuaternion(this.quaternion);
    }
  };
  var tempMat4 = /* @__PURE__ */ new Mat4();
  var tempVec3a = /* @__PURE__ */ new Vec3();
  var tempVec3b = /* @__PURE__ */ new Vec3();
  var Camera = class extends Transform {
    constructor(gl, { near = 0.1, far = 100, fov = 45, aspect = 1, left, right, bottom, top, zoom = 1 } = {}) {
      super();
      Object.assign(this, { near, far, fov, aspect, left, right, bottom, top, zoom });
      this.projectionMatrix = new Mat4();
      this.viewMatrix = new Mat4();
      this.projectionViewMatrix = new Mat4();
      this.worldPosition = new Vec3();
      this.type = left || right ? "orthographic" : "perspective";
      if (this.type === "orthographic") this.orthographic();
      else this.perspective();
    }
    perspective({ near = this.near, far = this.far, fov = this.fov, aspect = this.aspect } = {}) {
      Object.assign(this, { near, far, fov, aspect });
      this.projectionMatrix.fromPerspective({ fov: fov * (Math.PI / 180), aspect, near, far });
      this.type = "perspective";
      return this;
    }
    orthographic({
      near = this.near,
      far = this.far,
      left = this.left || -1,
      right = this.right || 1,
      bottom = this.bottom || -1,
      top = this.top || 1,
      zoom = this.zoom
    } = {}) {
      Object.assign(this, { near, far, left, right, bottom, top, zoom });
      left /= zoom;
      right /= zoom;
      bottom /= zoom;
      top /= zoom;
      this.projectionMatrix.fromOrthogonal({ left, right, bottom, top, near, far });
      this.type = "orthographic";
      return this;
    }
    updateMatrixWorld() {
      super.updateMatrixWorld();
      this.viewMatrix.inverse(this.worldMatrix);
      this.worldMatrix.getTranslation(this.worldPosition);
      this.projectionViewMatrix.multiply(this.projectionMatrix, this.viewMatrix);
      return this;
    }
    updateProjectionMatrix() {
      if (this.type === "perspective") {
        return this.perspective();
      } else {
        return this.orthographic();
      }
    }
    lookAt(target) {
      super.lookAt(target, true);
      return this;
    }
    // Project 3D coordinate to 2D point
    project(v) {
      v.applyMatrix4(this.viewMatrix);
      v.applyMatrix4(this.projectionMatrix);
      return this;
    }
    // Unproject 2D point to 3D coordinate
    unproject(v) {
      v.applyMatrix4(tempMat4.inverse(this.projectionMatrix));
      v.applyMatrix4(this.worldMatrix);
      return this;
    }
    updateFrustum() {
      if (!this.frustum) {
        this.frustum = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()];
      }
      const m = this.projectionViewMatrix;
      this.frustum[0].set(m[3] - m[0], m[7] - m[4], m[11] - m[8]).constant = m[15] - m[12];
      this.frustum[1].set(m[3] + m[0], m[7] + m[4], m[11] + m[8]).constant = m[15] + m[12];
      this.frustum[2].set(m[3] + m[1], m[7] + m[5], m[11] + m[9]).constant = m[15] + m[13];
      this.frustum[3].set(m[3] - m[1], m[7] - m[5], m[11] - m[9]).constant = m[15] - m[13];
      this.frustum[4].set(m[3] - m[2], m[7] - m[6], m[11] - m[10]).constant = m[15] - m[14];
      this.frustum[5].set(m[3] + m[2], m[7] + m[6], m[11] + m[10]).constant = m[15] + m[14];
      for (let i = 0; i < 6; i++) {
        const invLen = 1 / this.frustum[i].distance();
        this.frustum[i].multiply(invLen);
        this.frustum[i].constant *= invLen;
      }
    }
    frustumIntersectsMesh(node, worldMatrix = node.worldMatrix) {
      if (!node.geometry.attributes.position) return true;
      if (!node.geometry.bounds || node.geometry.bounds.radius === Infinity) node.geometry.computeBoundingSphere();
      if (!node.geometry.bounds) return true;
      const center = tempVec3a;
      center.copy(node.geometry.bounds.center);
      center.applyMatrix4(worldMatrix);
      const radius = node.geometry.bounds.radius * worldMatrix.getMaxScaleOnAxis();
      return this.frustumIntersectsSphere(center, radius);
    }
    frustumIntersectsSphere(center, radius) {
      const normal = tempVec3b;
      for (let i = 0; i < 6; i++) {
        const plane = this.frustum[i];
        const distance2 = normal.copy(plane).dot(center) + plane.constant;
        if (distance2 < -radius) return false;
      }
      return true;
    }
  };
  function fromMat4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }
  function fromQuat2(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;
    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;
    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;
    return out;
  }
  function copy5(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function set5(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function identity3(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function invert3(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }
  function multiply4(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b00 = b[0], b01 = b[1], b02 = b[2];
    let b10 = b[3], b11 = b[4], b12 = b[5];
    let b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  }
  function translate2(out, a, v) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  function rotate2(out, a, rad) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  }
  function scale4(out, a, v) {
    let x = v[0], y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function normalFromMat4(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  }
  var Mat3 = class extends Array {
    constructor(m00 = 1, m01 = 0, m02 = 0, m10 = 0, m11 = 1, m12 = 0, m20 = 0, m21 = 0, m22 = 1) {
      super(m00, m01, m02, m10, m11, m12, m20, m21, m22);
      return this;
    }
    set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
      if (m00.length) return this.copy(m00);
      set5(this, m00, m01, m02, m10, m11, m12, m20, m21, m22);
      return this;
    }
    translate(v, m = this) {
      translate2(this, m, v);
      return this;
    }
    rotate(v, m = this) {
      rotate2(this, m, v);
      return this;
    }
    scale(v, m = this) {
      scale4(this, m, v);
      return this;
    }
    multiply(ma, mb) {
      if (mb) {
        multiply4(this, ma, mb);
      } else {
        multiply4(this, this, ma);
      }
      return this;
    }
    identity() {
      identity3(this);
      return this;
    }
    copy(m) {
      copy5(this, m);
      return this;
    }
    fromMatrix4(m) {
      fromMat4(this, m);
      return this;
    }
    fromQuaternion(q) {
      fromQuat2(this, q);
      return this;
    }
    fromBasis(vec3a, vec3b, vec3c) {
      this.set(vec3a[0], vec3a[1], vec3a[2], vec3b[0], vec3b[1], vec3b[2], vec3c[0], vec3c[1], vec3c[2]);
      return this;
    }
    inverse(m = this) {
      invert3(this, m);
      return this;
    }
    getNormalMatrix(m) {
      normalFromMat4(this, m);
      return this;
    }
  };
  var ID4 = 0;
  var Mesh = class extends Transform {
    constructor(gl, { geometry, program, mode = gl.TRIANGLES, frustumCulled = true, renderOrder = 0 } = {}) {
      super();
      if (!gl.canvas) console.error("gl not passed as first argument to Mesh");
      this.gl = gl;
      this.id = ID4++;
      this.geometry = geometry;
      this.program = program;
      this.mode = mode;
      this.frustumCulled = frustumCulled;
      this.renderOrder = renderOrder;
      this.modelViewMatrix = new Mat4();
      this.normalMatrix = new Mat3();
      this.beforeRenderCallbacks = [];
      this.afterRenderCallbacks = [];
    }
    onBeforeRender(f) {
      this.beforeRenderCallbacks.push(f);
      return this;
    }
    onAfterRender(f) {
      this.afterRenderCallbacks.push(f);
      return this;
    }
    draw({ camera } = {}) {
      if (camera) {
        if (!this.program.uniforms.modelMatrix) {
          Object.assign(this.program.uniforms, {
            modelMatrix: { value: null },
            viewMatrix: { value: null },
            modelViewMatrix: { value: null },
            normalMatrix: { value: null },
            projectionMatrix: { value: null },
            cameraPosition: { value: null }
          });
        }
        this.program.uniforms.projectionMatrix.value = camera.projectionMatrix;
        this.program.uniforms.cameraPosition.value = camera.worldPosition;
        this.program.uniforms.viewMatrix.value = camera.viewMatrix;
        this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
        this.normalMatrix.getNormalMatrix(this.modelViewMatrix);
        this.program.uniforms.modelMatrix.value = this.worldMatrix;
        this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix;
        this.program.uniforms.normalMatrix.value = this.normalMatrix;
      }
      this.beforeRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
      let flipFaces = this.program.cullFace && this.worldMatrix.determinant() < 0;
      this.program.use({ flipFaces });
      this.geometry.draw({ mode: this.mode, program: this.program });
      this.afterRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
    }
  };
  var emptyPixel = new Uint8Array(4);
  function isPowerOf2(value) {
    return (value & value - 1) === 0;
  }
  var ID5 = 1;
  var Texture = class {
    constructor(gl, {
      image,
      target = gl.TEXTURE_2D,
      type = gl.UNSIGNED_BYTE,
      format = gl.RGBA,
      internalFormat = format,
      wrapS = gl.CLAMP_TO_EDGE,
      wrapT = gl.CLAMP_TO_EDGE,
      wrapR = gl.CLAMP_TO_EDGE,
      generateMipmaps = target === (gl.TEXTURE_2D || gl.TEXTURE_CUBE_MAP),
      minFilter = generateMipmaps ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR,
      magFilter = gl.LINEAR,
      premultiplyAlpha = false,
      unpackAlignment = 4,
      flipY = target == (gl.TEXTURE_2D || gl.TEXTURE_3D) ? true : false,
      anisotropy = 0,
      level = 0,
      width,
      // used for RenderTargets or Data Textures
      height = width,
      length: length3 = 1
    } = {}) {
      this.gl = gl;
      this.id = ID5++;
      this.image = image;
      this.target = target;
      this.type = type;
      this.format = format;
      this.internalFormat = internalFormat;
      this.minFilter = minFilter;
      this.magFilter = magFilter;
      this.wrapS = wrapS;
      this.wrapT = wrapT;
      this.wrapR = wrapR;
      this.generateMipmaps = generateMipmaps;
      this.premultiplyAlpha = premultiplyAlpha;
      this.unpackAlignment = unpackAlignment;
      this.flipY = flipY;
      this.anisotropy = Math.min(anisotropy, this.gl.renderer.parameters.maxAnisotropy);
      this.level = level;
      this.width = width;
      this.height = height;
      this.length = length3;
      this.texture = this.gl.createTexture();
      this.store = {
        image: null
      };
      this.glState = this.gl.renderer.state;
      this.state = {};
      this.state.minFilter = this.gl.NEAREST_MIPMAP_LINEAR;
      this.state.magFilter = this.gl.LINEAR;
      this.state.wrapS = this.gl.REPEAT;
      this.state.wrapT = this.gl.REPEAT;
      this.state.anisotropy = 0;
    }
    bind() {
      if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id) return;
      this.gl.bindTexture(this.target, this.texture);
      this.glState.textureUnits[this.glState.activeTextureUnit] = this.id;
    }
    update(textureUnit = 0) {
      const needsUpdate = !(this.image === this.store.image && !this.needsUpdate);
      if (needsUpdate || this.glState.textureUnits[textureUnit] !== this.id) {
        this.gl.renderer.activeTexture(textureUnit);
        this.bind();
      }
      if (!needsUpdate) return;
      this.needsUpdate = false;
      if (this.flipY !== this.glState.flipY) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        this.glState.flipY = this.flipY;
      }
      if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
        this.glState.premultiplyAlpha = this.premultiplyAlpha;
      }
      if (this.unpackAlignment !== this.glState.unpackAlignment) {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment);
        this.glState.unpackAlignment = this.unpackAlignment;
      }
      if (this.minFilter !== this.state.minFilter) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
        this.state.minFilter = this.minFilter;
      }
      if (this.magFilter !== this.state.magFilter) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.state.magFilter = this.magFilter;
      }
      if (this.wrapS !== this.state.wrapS) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS);
        this.state.wrapS = this.wrapS;
      }
      if (this.wrapT !== this.state.wrapT) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT);
        this.state.wrapT = this.wrapT;
      }
      if (this.wrapR !== this.state.wrapR) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR);
        this.state.wrapR = this.wrapR;
      }
      if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
        this.gl.texParameterf(this.target, this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy);
        this.state.anisotropy = this.anisotropy;
      }
      if (this.image) {
        if (this.image.width) {
          this.width = this.image.width;
          this.height = this.image.height;
        }
        if (this.target === this.gl.TEXTURE_CUBE_MAP) {
          for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.level, this.internalFormat, this.format, this.type, this.image[i]);
          }
        } else if (ArrayBuffer.isView(this.image)) {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.image);
          } else if (this.target === this.gl.TEXTURE_2D_ARRAY || this.target === this.gl.TEXTURE_3D) {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, this.image);
          }
        } else if (this.image.isCompressedTexture) {
          for (let level = 0; level < this.image.length; level++) {
            this.gl.compressedTexImage2D(this.target, level, this.internalFormat, this.image[level].width, this.image[level].height, 0, this.image[level].data);
          }
        } else {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.format, this.type, this.image);
          } else {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, this.image);
          }
        }
        if (this.generateMipmaps) {
          if (!this.gl.renderer.isWebgl2 && (!isPowerOf2(this.image.width) || !isPowerOf2(this.image.height))) {
            this.generateMipmaps = false;
            this.wrapS = this.wrapT = this.gl.CLAMP_TO_EDGE;
            this.minFilter = this.gl.LINEAR;
          } else {
            this.gl.generateMipmap(this.target);
          }
        }
        this.onUpdate && this.onUpdate();
      } else {
        if (this.target === this.gl.TEXTURE_CUBE_MAP) {
          for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixel);
          }
        } else if (this.width) {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, null);
          } else {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, null);
          }
        } else {
          this.gl.texImage2D(this.target, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixel);
        }
      }
      this.store.image = this.image;
    }
  };
  var EventEmitter = class {
    listeners = /* @__PURE__ */ new Map();
    on(event, callback) {
      for (const ev of event.trim().split(/\s+/)) {
        if (!ev) continue;
        if (!this.listeners.has(ev)) this.listeners.set(ev, []);
        this.listeners.get(ev).push({ cb: callback, once: false });
      }
      return this;
    }
    off(event, callback) {
      for (const ev of event.trim().split(/\s+/)) {
        if (!ev) continue;
        const list = this.listeners.get(ev);
        if (!list) continue;
        const idx = list.findIndex((e) => e.cb === callback);
        if (idx !== -1) list.splice(idx, 1);
      }
      return this;
    }
    once(event, callback) {
      for (const ev of event.trim().split(/\s+/)) {
        if (!ev) continue;
        if (!this.listeners.has(ev)) this.listeners.set(ev, []);
        this.listeners.get(ev).push({ cb: callback, once: true });
      }
      return this;
    }
    emit(event, ...args) {
      for (const ev of event.trim().split(/\s+/)) {
        if (!ev) continue;
        const list = this.listeners.get(ev);
        if (!list || list.length === 0) continue;
        const toRemove = [];
        for (let i = 0; i < list.length; i++) {
          list[i].cb(...args);
          if (list[i].once) toRemove.push(i);
        }
        for (let i = toRemove.length - 1; i >= 0; i--) {
          list.splice(toRemove[i], 1);
        }
      }
      return this;
    }
  };
  function parseColor(color) {
    const c = color.trim().toLowerCase();
    if (c.startsWith("#")) {
      let hex = c.substring(1);
      if (hex.length === 3 || hex.length === 4) {
        hex = Array.from(hex).map((char) => char + char).join("");
      }
      if (hex.length === 6) hex += "ff";
      if (hex.length !== 8) return null;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = parseInt(hex.substring(6, 8), 16) / 255;
      return [r, g, b, a];
    }
    const rgbMatch = c.match(/^rgba?\(([^)]+)\)/);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(/,|\s+/).filter(Boolean);
      if (parts.length < 3) return null;
      let tempParts = [];
      const cleaned = rgbMatch[1].replace(/[,/]/g, " ").split(/\s+/).filter(Boolean);
      const r = parseComp(cleaned[0], 255);
      const g = parseComp(cleaned[1], 255);
      const b = parseComp(cleaned[2], 255);
      const a = cleaned.length > 3 ? parseComp(cleaned[3], 1) : 1;
      return [r, g, b, a];
    }
    const hslMatch = c.match(/^hsla?\(([^)]+)\)/);
    if (hslMatch) {
      const cleaned = hslMatch[1].replace(/[,/]/g, " ").split(/\s+/).filter(Boolean);
      if (cleaned.length < 3) return null;
      let h = parseFloat(cleaned[0]);
      if (cleaned[0].endsWith("turn")) h = parseFloat(cleaned[0]) * 360;
      else if (cleaned[0].endsWith("rad")) h = parseFloat(cleaned[0]) * 180 / Math.PI;
      const s = parseComp(cleaned[1], 1);
      const l = parseComp(cleaned[2], 1);
      const a = cleaned.length > 3 ? parseComp(cleaned[3], 1) : 1;
      const rgb = hslToRgb(h / 360, s, l);
      return [rgb[0], rgb[1], rgb[2], a];
    }
    return null;
  }
  function parseComp(val, max) {
    if (val.endsWith("%")) {
      return parseFloat(val) / 100 * max;
    }
    return parseFloat(val);
  }
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  function formatColor(rgba) {
    const r = Math.round(rgba[0]);
    const g = Math.round(rgba[1]);
    const b = Math.round(rgba[2]);
    const a = rgba[3];
    if (a === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  function interpolateColor(from, to, t) {
    const fromRGBA = parseColor(from);
    const toRGBA = parseColor(to);
    if (fromRGBA && toRGBA) {
      const result = [
        fromRGBA[0] + (toRGBA[0] - fromRGBA[0]) * t,
        fromRGBA[1] + (toRGBA[1] - fromRGBA[1]) * t,
        fromRGBA[2] + (toRGBA[2] - fromRGBA[2]) * t,
        fromRGBA[3] + (toRGBA[3] - fromRGBA[3]) * t
      ];
      return formatColor(result);
    }
    if (from.includes(",") || to.includes(",")) {
      const fromParts = from.split(/,(?![^(]*\))/).map((x) => x.trim());
      const toParts = to.split(/,(?![^(]*\))/).map((x) => x.trim());
      if (fromParts.length === toParts.length && fromParts.length > 0) {
        const resultParts = [];
        let success = true;
        for (let i = 0; i < fromParts.length; i++) {
          const fStr = fromParts[i];
          const tStr = toParts[i];
          const angleMatchF = fStr.match(/^(-?\d*\.?\d+)(deg|turn|rad)$/);
          const angleMatchT = tStr.match(/^(-?\d*\.?\d+)(deg|turn|rad)$/);
          if (angleMatchF && angleMatchT && angleMatchF[2] === angleMatchT[2]) {
            const v = parseFloat(angleMatchF[1]) + (parseFloat(angleMatchT[1]) - parseFloat(angleMatchF[1])) * t;
            resultParts.push(`${v}${angleMatchF[2]}`);
            continue;
          }
          const stopRegex = /^(.+?)(?:\s+(-?\d*\.?\d+%?))?$/;
          const fMatch = fStr.match(stopRegex);
          const tMatch = tStr.match(stopRegex);
          if (fMatch && tMatch) {
            const fColorStr = fMatch[1];
            const tColorStr = tMatch[1];
            const fPos = fMatch[2] || "";
            const tPos = tMatch[2] || "";
            const interpolatedColor = interpolateColor(fColorStr, tColorStr, t);
            if (interpolatedColor) {
              let interpolatedPos = fPos;
              if (fPos.endsWith("%") && tPos.endsWith("%")) {
                const fv = parseFloat(fPos);
                const tv = parseFloat(tPos);
                interpolatedPos = `${fv + (tv - fv) * t}%`;
              }
              if (interpolatedPos) resultParts.push(`${interpolatedColor} ${interpolatedPos}`);
              else resultParts.push(`${interpolatedColor}`);
              continue;
            }
          }
          success = false;
          break;
        }
        if (success) {
          return resultParts.join(", ");
        }
      }
    }
    return null;
  }
  var easings = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - --t * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + --t * t * t * t * t,
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
    easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t) => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
    easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
    easeInBack: (t) => {
      const c1 = 1.70158;
      return (c1 + 1) * t * t * t - c1 * t * t;
    },
    easeOutBack: (t) => {
      const c1 = 1.70158;
      return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: (t) => {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
    },
    easeInElastic: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
    },
    easeOutElastic: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },
    easeInOutElastic: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2 : Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5)) / 2 + 1;
    },
    easeInBounce: (t) => 1 - easings.easeOutBounce(1 - t),
    easeOutBounce: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    easeInOutBounce: (t) => t < 0.5 ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2 : (1 + easings.easeOutBounce(2 * t - 1)) / 2
  };
  function resolveTarget(current, raw) {
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      if (raw.startsWith("+=")) return (typeof current === "number" ? current : parseFloat(current)) + parseFloat(raw.slice(2));
      if (raw.startsWith("-=")) return (typeof current === "number" ? current : parseFloat(current)) - parseFloat(raw.slice(2));
      if (raw.startsWith("*=")) return (typeof current === "number" ? current : parseFloat(current)) * parseFloat(raw.slice(2));
      if (raw.startsWith("/=")) return (typeof current === "number" ? current : parseFloat(current)) / parseFloat(raw.slice(2));
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && raw.trim() === parsed.toString()) return parsed;
      return raw;
    }
    return raw;
  }
  function snapshotNumbers(source, target) {
    const snapshot = {};
    for (const key of Object.keys(target)) {
      const tVal = target[key];
      const sVal = source?.[key];
      if (tVal != null && typeof tVal === "object" && !Array.isArray(tVal)) {
        snapshot[key] = snapshotNumbers(sVal ?? {}, tVal);
      } else if (typeof tVal === "number" || typeof tVal === "string") {
        if (typeof sVal === "number" || typeof sVal === "string") {
          snapshot[key] = sVal;
        } else {
          snapshot[key] = typeof tVal === "number" ? 0 : "";
        }
      }
    }
    return snapshot;
  }
  function interpolate(from, to, t, rawTarget) {
    const result = {};
    for (const key of Object.keys(to)) {
      const toVal = to[key];
      const fromVal = from?.[key];
      const raw = rawTarget[key];
      if (toVal != null && typeof toVal === "object" && !Array.isArray(toVal)) {
        result[key] = interpolate(fromVal ?? {}, toVal, t, raw);
      } else if (typeof toVal === "number" && typeof fromVal === "number") {
        result[key] = fromVal + (toVal - fromVal) * t;
      } else if (typeof toVal === "string" && typeof fromVal === "string") {
        const colorInterp = interpolateColor(fromVal, toVal, t);
        if (colorInterp) {
          result[key] = colorInterp;
        } else {
          result[key] = t < 0.5 ? fromVal : toVal;
        }
      }
    }
    return result;
  }
  function resolveAllTargets(current, raw) {
    const resolved = {};
    for (const key of Object.keys(raw)) {
      const rVal = raw[key];
      const cVal = current?.[key];
      if (rVal != null && typeof rVal === "object" && !Array.isArray(rVal)) {
        resolved[key] = resolveAllTargets(cVal ?? {}, rVal);
      } else if (typeof rVal === "number" || typeof rVal === "string") {
        resolved[key] = resolveTarget(cVal !== void 0 ? cVal : typeof rVal === "number" ? 0 : "", rVal);
      }
    }
    return resolved;
  }
  var Animation = class extends EventEmitter {
    initialTarget;
    rafId = null;
    startTime = null;
    pausedElapsed = 0;
    isPaused = false;
    duration = 0;
    easingFn = easings.linear;
    callback = null;
    from = {};
    to = {};
    constructor(target) {
      super();
      this.initialTarget = target;
    }
    /**
     * 애니메이션을 시작합니다.
     * @param callback 매 프레임마다 현재 상태를 전달받는 콜백
     * @param duration 지속 시간 (ms)
     * @param easing 이징 함수 이름 (기본값: 'linear')
     */
    start(callback, duration, easing = "linear") {
      this.stop();
      this.callback = callback;
      this.duration = duration;
      this.easingFn = easings[easing] ?? easings.linear;
      this.from = snapshotNumbers({}, this.initialTarget);
      this.to = resolveAllTargets({}, this.initialTarget);
      this.pausedElapsed = 0;
      this.isPaused = false;
      this.emit("start");
      this._tick(null);
      return this;
    }
    pause() {
      if (this.isPaused || this.startTime === null) return this;
      this.isPaused = true;
      this.pausedElapsed += performance.now() - this.startTime;
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.emit("pause");
      return this;
    }
    resume() {
      if (!this.isPaused) return this;
      this.isPaused = false;
      this.startTime = null;
      this.emit("resume");
      this._tick(null);
      return this;
    }
    stop() {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.emit("stop");
      }
      this.startTime = null;
      this.pausedElapsed = 0;
      this.isPaused = false;
      return this;
    }
    _tick(timestamp) {
      const now = timestamp ?? performance.now();
      if (this.startTime === null) {
        this.startTime = now - this.pausedElapsed;
      }
      const elapsed = now - this.startTime;
      const rawT = Math.min(elapsed / this.duration, 1);
      const easedT = this.easingFn(rawT);
      const state = interpolate(this.from, this.to, easedT, this.initialTarget);
      this.callback?.(state);
      this.emit("update", state);
      if (rawT < 1) {
        this.rafId = requestAnimationFrame((ts) => this._tick(ts));
      } else {
        this.rafId = null;
        this.emit("end");
      }
    }
  };
  function animateObject(source, rawTarget, duration, easing = "linear") {
    const from = snapshotNumbers(source, rawTarget);
    const to = resolveAllTargets(source, rawTarget);
    const easingFn = easings[easing] ?? easings.linear;
    let startTime = null;
    const anim = new Animation(rawTarget);
    anim.from = from;
    anim.to = to;
    anim.duration = duration;
    anim.easingFn = easingFn;
    anim.pausedElapsed = 0;
    anim.isPaused = false;
    const tick = (timestamp) => {
      const now = timestamp ?? performance.now();
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / duration, 1);
      const easedT = easingFn(rawT);
      applyInterpolated(source, from, to, easedT, rawTarget);
      if (rawT < 1) {
        anim.rafId = requestAnimationFrame((ts) => tick(ts));
      } else {
        anim.rafId = null;
        anim.emit("end");
      }
    };
    anim.rafId = requestAnimationFrame((ts) => tick(ts));
    return anim;
  }
  function applyInterpolated(source, from, to, t, raw) {
    for (const key of Object.keys(to)) {
      const toVal = to[key];
      const fromVal = from?.[key];
      if (toVal != null && typeof toVal === "object" && !Array.isArray(toVal)) {
        if (source[key] === void 0 || source[key] === null) source[key] = {};
        applyInterpolated(source[key], fromVal ?? {}, toVal, t, raw[key]);
      } else if (typeof toVal === "number" && typeof fromVal === "number") {
        source[key] = fromVal + (toVal - fromVal) * t;
      } else if (typeof toVal === "string" && typeof fromVal === "string") {
        const colorInterp = interpolateColor(fromVal, toVal, t);
        if (colorInterp) {
          source[key] = colorInterp;
        } else {
          source[key] = t < 0.5 ? fromVal : toVal;
        }
      }
    }
  }
  var BaseTransition = class extends EventEmitter {
    _anim = null;
    _onUpdate = null;
    _onComplete = null;
    target;
    constructor(target) {
      super();
      this.target = target;
    }
    _startTransition(durationMs, easing, onUpdate, onComplete) {
      if (this._anim) this._anim.stop();
      this._onUpdate = onUpdate;
      this._onComplete = onComplete;
      this.emit("start");
      this._anim = new Animation({ progress: 1 });
      this._anim.start((state) => {
        onUpdate(state.progress);
        this.emit("update", state);
      }, durationMs, easing || "linear");
      this._anim.on("end", () => {
        this._anim = null;
        this._onUpdate = null;
        this._onComplete = null;
        onComplete();
        this.emit("end");
      });
    }
    stop() {
      if (this._anim) {
        this._anim.stop();
        this._anim = null;
        const onUpdate = this._onUpdate;
        const onComplete = this._onComplete;
        this._onUpdate = null;
        this._onComplete = null;
        onUpdate?.(1);
        onComplete?.();
        this.emit("end");
      }
      return this;
    }
    pause() {
      if (this._anim) {
        this._anim.pause();
        this.emit("pause");
      }
      return this;
    }
    resume() {
      if (this._anim) {
        this._anim.resume();
        this.emit("resume");
      }
      return this;
    }
  };
  var FadeTransition = class extends BaseTransition {
    constructor(target) {
      super(target);
    }
    start(durationMs, easing, type) {
      if (this._anim) this._anim.stop();
      if (type === "out") {
        const fromOpacity = this.target.__fadeOpacity;
        this.target.__dirtyTexture = true;
        this._startTransition(
          durationMs,
          easing,
          (progress) => {
            this.target.__fadeOpacity = fromOpacity * (1 - progress);
            this.target.__dirtyTexture = true;
          },
          () => {
            this.target.style.display = "none";
            this.target.__fadeOpacity = 0;
          }
        );
      } else {
        this.target.style.display = "block";
        const fromOpacity = this.target.__fadeOpacity;
        this.target.__dirtyTexture = true;
        this._startTransition(
          durationMs,
          easing,
          (progress) => {
            this.target.__fadeOpacity = fromOpacity + (1 - fromOpacity) * progress;
            this.target.__dirtyTexture = true;
          },
          () => {
            this.target.__fadeOpacity = 1;
          }
        );
      }
      return this;
    }
  };
  var STYLE_DIRTY_MAP = {
    // 텍스처만 재생성
    color: ["texture"],
    gradient: ["texture"],
    gradientType: ["texture"],
    textAlign: ["texture"],
    textShadowColor: ["texture"],
    textShadowBlur: ["texture"],
    textShadowOffsetX: ["texture"],
    textShadowOffsetY: ["texture"],
    boxShadowColor: ["texture"],
    boxShadowBlur: ["texture"],
    boxShadowSpread: ["texture"],
    boxShadowOffsetX: ["texture"],
    boxShadowOffsetY: ["texture"],
    borderRadius: ["texture"],
    // 텍스처 + 물리 바디 재계산
    fontSize: ["texture", "physics"],
    fontFamily: ["texture", "physics"],
    fontWeight: ["texture", "physics"],
    fontStyle: ["texture", "physics"],
    lineHeight: ["texture", "physics"],
    letterSpacing: ["texture", "physics"],
    width: ["texture", "physics"],
    height: ["texture", "physics"],
    borderWidth: ["texture", "physics"],
    // 물리 바디만 재계산
    margin: ["physics"]
  };
  var ATTR_DIRTY_MAP = {
    text: ["texture", "physics"],
    src: ["texture", "physics"],
    // 물리 바디 파라미터
    physics: ["physics"],
    density: ["physics"],
    friction: ["physics"],
    frictionAir: ["physics"],
    restitution: ["physics"],
    fixedRotation: ["physics"],
    gravityScale: ["physics"],
    collisionGroup: ["physics"],
    collisionMask: ["physics"],
    collisionCategory: ["physics"]
  };
  var SCALE_DIRTY_MAP = {
    x: ["physics"],
    y: ["physics"]
  };
  var TEXTURE_THROTTLE_FRAMES = 8;
  var TEXTURE_DEBOUNCE_FRAMES = 2;
  var PHYSICS_THROTTLE_FRAMES = 6;
  var PHYSICS_DEBOUNCE_FRAMES = 2;
  var VEC3_X = new Vec3(1, 0, 0);
  var VEC3_Y = new Vec3(0, 1, 0);
  var VEC3_Z = new Vec3(0, 0, 1);
  var _tmpVec3 = new Vec3(0, 0, 0);
  function makeVec3(partial) {
    return {
      x: partial?.x ?? 0,
      y: partial?.y ?? 0,
      z: partial?.z ?? 0
    };
  }
  function makeStyle(partial) {
    return {
      color: partial?.color,
      opacity: partial?.opacity ?? 1,
      width: partial?.width,
      height: partial?.height,
      blur: partial?.blur,
      borderColor: partial?.borderColor,
      borderWidth: partial?.borderWidth,
      outlineColor: partial?.outlineColor,
      outlineWidth: partial?.outlineWidth,
      fontSize: partial?.fontSize,
      fontFamily: partial?.fontFamily,
      fontWeight: partial?.fontWeight,
      fontStyle: partial?.fontStyle ?? "normal",
      textAlign: partial?.textAlign ?? "left",
      lineHeight: partial?.lineHeight ?? 1,
      display: partial?.display ?? "block",
      pointerEvents: partial?.pointerEvents ?? true,
      margin: partial?.margin,
      textShadowColor: partial?.textShadowColor,
      textShadowBlur: partial?.textShadowBlur,
      textShadowOffsetX: partial?.textShadowOffsetX,
      textShadowOffsetY: partial?.textShadowOffsetY,
      boxShadowColor: partial?.boxShadowColor,
      boxShadowBlur: partial?.boxShadowBlur,
      boxShadowSpread: partial?.boxShadowSpread,
      boxShadowOffsetX: partial?.boxShadowOffsetX,
      boxShadowOffsetY: partial?.boxShadowOffsetY,
      zIndex: partial?.zIndex ?? 0,
      blendMode: partial?.blendMode,
      letterSpacing: partial?.letterSpacing ?? 0,
      gradient: partial?.gradient,
      gradientType: partial?.gradientType,
      borderRadius: partial?.borderRadius
    };
  }
  function makeTrackedProxy(target, emitter, eventName, delegatedKeys) {
    return new Proxy(target, {
      get(obj, prop) {
        if (typeof prop === "string" && delegatedKeys?.includes(prop)) {
          return emitter._getDelegatedAttribute(prop);
        }
        return obj[prop];
      },
      set(obj, prop, value) {
        let prev;
        if (typeof prop === "string" && delegatedKeys?.includes(prop)) {
          prev = emitter._getDelegatedAttribute(prop);
          emitter._setDelegatedAttribute(prop, value);
        } else {
          prev = obj[prop];
          obj[prop] = value;
        }
        if (prev !== value) {
          emitter.emit(eventName, String(prop), value, prev);
        }
        return true;
      }
    });
  }
  function makeVec3Proxy(vec, emitter, eventName) {
    return new Proxy(vec, {
      set(obj, prop, value) {
        const prev = obj[prop];
        obj[prop] = value;
        if (prev !== value) {
          emitter.emit(eventName, String(prop), value, prev);
        }
        return true;
      }
    });
  }
  var LeviarObject = class extends EventEmitter {
    attribute;
    dataset;
    style;
    transform;
    /** matter-js 바디 참조 (PhysicsEngine에서 설정) */
    __body = null;
    /**
     * attribute Proxy의 위임 키에 대한 값을 가져옵니다. (하위 클래스에서 재정의)
     */
    _getDelegatedAttribute(key) {
      return void 0;
    }
    /**
     * attribute Proxy의 위임 키에 대한 값을 설정합니다. (하위 클래스에서 재정의)
     */
    _setDelegatedAttribute(key, value) {
    }
    /**
     * Renderer가 매 프레임 기록하는 실제 렌더 크기 (월드 좌표 기준, scale 포함, perspectiveScale 제외)
     * style.width/height 미지정 시 naturalWidth 등의 값이 들어옵니다.
     */
    __renderedSize = null;
    /** Offscreen Canvas · 텍스처 재생성이 필요함을 나타내는 dirty flag */
    __dirtyTexture = true;
    /** 물리 바디 크기 재확인이 필요함을 나타내는 dirty flag */
    __dirtyPhysics = false;
    /**
     * 마지막 텍스처 변경 이후 경과한 프레임 수.
     * 새 변경이 오면 0으로 리셋, 임계값 도달 시 텍스처를 업데이트합니다. (디바운스)
     */
    __textureIdleCount = 0;
    /**
     * 마지막 물리 변경 이후 경과한 프레임 수.
     * 새 변경이 오면 0으로 리셋, 임계값 도달 시 물리 실제 크기를 재확인합니다. (디바운스)
     */
    __physicsIdleCount = 0;
    /**
     * 마지막 텍스처 업데이트 이후 경과한 프레임 수.
     * 렌더 후 0으로 리셋, 임계값 도달 시 강제 업데이트합니다. (스로틀)
     */
    __textureThrottleCount = 0;
    /**
     * 마지막 물리 업데이트 이후 경과한 프레임 수.
     * 업데이트 후 0으로 리셋, 임계값 도달 시 강제 재확인합니다. (스로틀)
     */
    __physicsThrottleCount = 0;
    /**
     * FadeTransition에 의해 제어되는 렌더링용 내부 투명도.
     */
    __fadeOpacity = 1;
    /** 부모 객체 (계층 구조) */
    parent = null;
    /** 자식 객체 목록 */
    children = /* @__PURE__ */ new Set();
    /** 로컬 변환 매트릭스 (자신의 position, rotation, scale) */
    localMatrix = new Mat4();
    /** 부모의 반영이 끝난 최종 월드 매트릭스 */
    __worldMatrix = new Mat4();
    constructor(type, options, delegatedKeys) {
      super();
      const rawAttribute = {
        type,
        id: v4(),
        name: options?.attribute?.name ?? "",
        className: options?.attribute?.className ?? "",
        physics: options?.attribute?.physics ?? null,
        density: options?.attribute?.density,
        friction: options?.attribute?.friction,
        restitution: options?.attribute?.restitution,
        fixedRotation: options?.attribute?.fixedRotation,
        gravityScale: options?.attribute?.gravityScale,
        collisionGroup: options?.attribute?.collisionGroup,
        collisionMask: options?.attribute?.collisionMask,
        collisionCategory: options?.attribute?.collisionCategory,
        ...options?.attribute
      };
      const rawDataset = Object.assign({}, options?.dataset);
      const rawStyle = makeStyle(options?.style);
      const rawPosition = makeVec3(options?.transform?.position);
      const rawRotation = makeVec3(options?.transform?.rotation);
      const rawScale = {
        x: options?.transform?.scale?.x ?? 1,
        y: options?.transform?.scale?.y ?? 1,
        z: options?.transform?.scale?.z ?? 1
      };
      const rawPivot = {
        x: options?.transform?.pivot?.x ?? 0.5,
        y: options?.transform?.pivot?.y ?? 0.5
      };
      this.attribute = makeTrackedProxy(rawAttribute, this, "attrmodified", delegatedKeys);
      this.dataset = makeTrackedProxy(rawDataset, this, "datamodified");
      this.style = makeTrackedProxy(rawStyle, this, "cssmodified");
      this.transform = {
        position: makeVec3Proxy(rawPosition, this, "positionmodified"),
        rotation: makeVec3Proxy(rawRotation, this, "rotationmodified"),
        scale: makeVec3Proxy(rawScale, this, "scalemodified"),
        pivot: new Proxy(rawPivot, {
          set: (obj, prop, value) => {
            const prev = obj[prop];
            obj[prop] = value;
            if (prev !== value) {
              this.emit("pivotmodified", String(prop), value, prev);
            }
            return true;
          }
        })
      };
      this.on("cssmodified", (key) => {
        const flags = STYLE_DIRTY_MAP[key];
        if (!flags) return;
        if (flags.includes("texture")) {
          this.__dirtyTexture = true;
          this.__textureIdleCount = 0;
        }
        if (flags.includes("physics")) {
          this.__dirtyPhysics = true;
          this.__physicsIdleCount = 0;
        }
      });
      this.on("attrmodified", (key) => {
        const flags = ATTR_DIRTY_MAP[key];
        if (!flags) return;
        if (flags.includes("texture")) {
          this.__dirtyTexture = true;
          this.__textureIdleCount = 0;
        }
        if (flags.includes("physics")) {
          this.__dirtyPhysics = true;
          this.__physicsIdleCount = 0;
        }
      });
      this.on("scalemodified", (key) => {
        const flags = SCALE_DIRTY_MAP[key];
        if (!flags) return;
        if (flags.includes("physics")) {
          this.__dirtyPhysics = true;
          this.__physicsIdleCount = 0;
        }
      });
      this.on("pivotmodified", () => {
        this.__dirtyPhysics = true;
        this.__physicsIdleCount = 0;
      });
    }
    /**
     * 계층 구조(Hierarchy)의 자식으로 다른 LeviarObject를 추가합니다.
     * 부모 객체의 3D 매트릭스 변환을 완전히 상속받게 됩니다.
     */
    addChild(child) {
      if (child.parent) {
        child.parent.removeChild(child);
      }
      child.parent = this;
      this.children.add(child);
      return this;
    }
    /**
     * 자식 객체를 삭제합니다.
     */
    removeChild(child) {
      if (child.parent === this) {
        child.parent = null;
        this.children.delete(child);
      }
      return this;
    }
    /**
     * 현재 부모 객체로부터 독립합니다.
     */
    removeFromParent() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
      return this;
    }
    /**
     * 객체를 월드에서 제거합니다.
     * @param options 제거 옵션. child: true이면 자식 객체도 함께 삭제, follower: true이면 자신을 따라다니는 객체도 함께 삭제 (기본값: 모두 false)
     */
    remove(options) {
      const removeChild = options?.child ?? false;
      const removeFollower = options?.follower ?? false;
      if (removeChild) {
        const childrenToDrop = Array.from(this.children);
        for (const child of childrenToDrop) {
          child.remove(options);
        }
      }
      this.removeFromParent();
      const followersToKick = Array.from(this.followers);
      for (const follower of followersToKick) {
        this.kick(follower);
        if (removeFollower) {
          follower.remove(options);
        }
      }
      this.emit("remove", this);
      return this;
    }
    /**
     * 객체의 로컬 트랜스폼 및 피벗을 이용해 월드 매트릭스를 재귀적으로 계산 및 갱신합니다.
     * World.ts 의 렌더 루프 전에 루트 노드로부터 호출되어야 합니다.
     */
    __updateMatrixWorld(force = false) {
      const pos = this.transform.position;
      const rot = this.transform.rotation;
      const scale5 = this.transform.scale;
      this.localMatrix.identity();
      _tmpVec3.set(pos.x, pos.y, -pos.z);
      this.localMatrix.translate(_tmpVec3);
      if (rot.z) this.localMatrix.rotate(rot.z * Math.PI / 180, VEC3_Z);
      if (rot.y) this.localMatrix.rotate(rot.y * Math.PI / 180, VEC3_Y);
      if (rot.x) this.localMatrix.rotate(rot.x * Math.PI / 180, VEC3_X);
      _tmpVec3.set(scale5.x, scale5.y, scale5.z);
      this.localMatrix.scale(_tmpVec3);
      if (this.parent) {
        this.__worldMatrix.multiply(this.parent.__worldMatrix, this.localMatrix);
      } else {
        this.__worldMatrix.copy(this.localMatrix);
      }
      for (const child of this.children) {
        child.__updateMatrixWorld(force);
      }
    }
    /**
     * 객체가 주어진 클래스들을 모두 포함하고 있는지 확인합니다. (공백으로 구분)
     * 전달된 모든 클래스가 존재할 때만 true를 반환합니다.
     */
    hasClass(classNames) {
      if (!classNames || !this.attribute.className) return false;
      const currentClasses = this.attribute.className.split(/\s+/).filter(Boolean);
      const requiredClasses = classNames.split(/\s+/).filter(Boolean);
      if (requiredClasses.length === 0) return false;
      return requiredClasses.every((cls) => currentClasses.includes(cls));
    }
    /**
     * 객체에 하나 이상의 클래스를 추가합니다. (공백으로 구분)
     * 이미 존재하는 클래스는 무시됩니다.
     */
    addClass(classNames) {
      if (!classNames) return this;
      const currentClasses = (this.attribute.className || "").split(/\s+/).filter(Boolean);
      const newClasses = classNames.split(/\s+/).filter(Boolean);
      let changed = false;
      for (const cls of newClasses) {
        if (!currentClasses.includes(cls)) {
          currentClasses.push(cls);
          changed = true;
        }
      }
      if (changed) {
        this.attribute.className = currentClasses.join(" ");
      }
      return this;
    }
    /**
     * 객체에서 하나 이상의 클래스를 제거합니다. (공백으로 구분)
     * 존재하지 않는 클래스는 무시됩니다.
     */
    removeClass(classNames) {
      if (!classNames || !this.attribute.className) return this;
      const currentClasses = this.attribute.className.split(/\s+/).filter(Boolean);
      const removeClasses = classNames.split(/\s+/).filter(Boolean);
      const newClasses = currentClasses.filter((c) => !removeClasses.includes(c));
      if (currentClasses.length !== newClasses.length) {
        this.attribute.className = newClasses.join(" ");
      }
      return this;
    }
    /**
     * 물리 바디에 힘을 적용합니다. attribute.physics가 설정된 경우에만 동작합니다.
     */
    applyForce(force) {
      if (!this.__body) {
        console.warn("[LeviarObject] applyForce: \uBB3C\uB9AC \uBC14\uB514\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. attribute.physics\uB97C \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      const Matter3 = globalThis.__Matter__;
      if (Matter3) {
        Matter3.Body.applyForce(this.__body, this.__body.position, { x: force.x ?? 0, y: force.y ?? 0 });
      }
      return this;
    }
    /**
     * 물리 바디의 속도를 설정합니다. attribute.physics가 설정된 경우에만 동작합니다.
     */
    setVelocity(velocity) {
      if (!this.__body) {
        console.warn("[LeviarObject] setVelocity: \uBB3C\uB9AC \uBC14\uB514\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. attribute.physics\uB97C \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      const Matter3 = globalThis.__Matter__;
      if (Matter3) {
        Matter3.Body.setVelocity(this.__body, { x: velocity.x ?? this.__body.velocity.x, y: velocity.y ?? this.__body.velocity.y });
      }
      return this;
    }
    /**
     * 물리 바디의 각속도를 설정합니다. attribute.physics가 설정된 경우에만 동작합니다.
     * @param angularVelocity 각속도 (라디안/초)
     */
    setAngularVelocity(angularVelocity) {
      if (!this.__body) {
        console.warn("[LeviarObject] setAngularVelocity: \uBB3C\uB9AC \uBC14\uB514\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. attribute.physics\uB97C \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      const Matter3 = globalThis.__Matter__;
      if (Matter3) {
        Matter3.Body.setAngularVelocity(this.__body, angularVelocity);
      }
      return this;
    }
    /**
     * 물리 바디에 토크(회전력)를 적용합니다. attribute.physics가 설정된 경우에만 동작합니다.
     * Matter.js는 매 스텝마다 torque를 소비하므로, 매 프레임 호출하면 지속적인 회전력이 됩니다.
     * @param torque 토크 값 (양수: 시계 방향, 음수: 반시계 방향)
     */
    applyTorque(torque) {
      if (!this.__body) {
        console.warn("[LeviarObject] applyTorque: \uBB3C\uB9AC \uBC14\uB514\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. attribute.physics\uB97C \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      this.__body.torque += torque;
      return this;
    }
    _followTarget;
    _followOffset;
    _followListener;
    _followers = /* @__PURE__ */ new Set();
    /**
     * 자신이 따라다니는 객체를 반환합니다. 없다면 undefined를 반환합니다.
     */
    get following() {
      return this._followTarget;
    }
    /**
     * 현재 자신을 따라다니거나 들러붙은 모든 객체를 배열로 반환합니다.
     */
    get followers() {
      return Array.from(this._followers);
    }
    /**
     * 다른 LeviarObject를 일정 거리를 두고 따라다닙니다.
     * 기존에 따라다니던 객체가 있다면 새로운 객체로 덮어씁니다.
     */
    follow(target, offset) {
      this.unfollow();
      this._followTarget = target;
      this._followOffset = offset;
      target["_followers"].add(this);
      this._followListener = () => {
        if (this._followOffset?.x !== void 0) {
          this.transform.position.x = target.transform.position.x + this._followOffset.x;
        } else {
          this.transform.position.x = target.transform.position.x;
        }
        if (this._followOffset?.y !== void 0) {
          this.transform.position.y = target.transform.position.y + this._followOffset.y;
        } else {
          this.transform.position.y = target.transform.position.y;
        }
        if (this._followOffset?.z !== void 0) {
          this.transform.position.z = target.transform.position.z + this._followOffset.z;
        } else {
          this.transform.position.z = target.transform.position.z;
        }
      };
      target.on("positionmodified", this._followListener);
      this._followListener("", 0);
      return this;
    }
    /**
     * 대상을 따라다니는 동작을 중지합니다.
     */
    unfollow() {
      if (this._followTarget && this._followListener) {
        this._followTarget.off("positionmodified", this._followListener);
        this._followTarget["_followers"].delete(this);
        this._followTarget = void 0;
        this._followListener = void 0;
        this._followOffset = void 0;
      }
      return this;
    }
    /**
     * 자신을 따라다니는 특정 오브젝트의 추적을 끊어냅니다. (unfollow 시킴)
     * @param follower 제거할 추적 객체
     */
    kick(follower) {
      if (this["_followers"].has(follower)) {
        follower.unfollow();
      }
      return this;
    }
    /**
     * 객체의 속성을 애니메이션으로 부드럽게 변경합니다.
     * @param target 변경할 속성과 목표값 (숫자 or 복합 대입 연산자 문자열)
     * @param duration 지속 시간 (ms)
     * @param easing 이징 함수 이름 (기본값: 'linear')
     */
    animate(target, duration, easing = "linear") {
      const normalized = { ...target };
      if (normalized.position) {
        if (!normalized.transform) normalized.transform = {};
        normalized.transform.position = normalized.position;
        delete normalized.position;
      }
      const source = {
        style: this.style,
        transform: this.transform,
        dataset: this.dataset,
        attribute: this.attribute
      };
      return animateObject(source, normalized, duration, easing);
    }
    _fadeTransition;
    /**
     * 객체를 부드럽게 나타나게 합니다 (display: block 이후 투명도 0 -> 1).
     */
    fadeIn(durationMs, easing) {
      if (!this._fadeTransition) {
        this._fadeTransition = new FadeTransition(this);
      }
      this._fadeTransition.start(durationMs, easing, "in");
      return this._fadeTransition;
    }
    /**
     * 객체를 부드럽게 사라지게 합니다 (투명도 1 -> 0 이후 display: none).
     */
    fadeOut(durationMs, easing) {
      if (!this._fadeTransition) {
        this._fadeTransition = new FadeTransition(this);
      }
      this._fadeTransition.start(durationMs, easing, "out");
      return this._fadeTransition;
    }
  };
  var Camera2 = class extends LeviarObject {
    /** @internal */
    __world;
    constructor(options) {
      super("camera", options);
      if (this.attribute.focalLength === void 0) {
        this.attribute.focalLength = 100;
      }
    }
    /**
     * 캔버스의 x, y 좌표(0 ~ width, 0 ~ height)를 카메라 기준의 월드 좌표로 변환합니다.
     * @param x 캔버스 좌측 상단을 0으로 하는 x 좌표
     * @param y 캔버스 좌측 상단을 0으로 하는 y 좌표
     * @param targetZ (선택) 투영하고자 하는 월드 공간의 Z 좌표. 지정하지 않으면 카메라의 fov가 1:1이 되는 심도(camZ + focalLength)로 계산됩니다.
     */
    canvasToWorld(x, y, targetZ) {
      const w = this.__world?.["_canvas"]?.width ?? window.innerWidth;
      const h = this.__world?.["_canvas"]?.height ?? window.innerHeight;
      const screenX = x - w / 2;
      const screenY = -(y - h / 2);
      const camX = this.transform.position.x;
      const camY = this.transform.position.y;
      const camZ = this.transform.position.z;
      const rotX = this.transform.rotation.x || 0;
      const rotY = this.transform.rotation.y || 0;
      const rotZ = this.transform.rotation.z || 0;
      const focalLength = this.attribute.focalLength ?? 100;
      const tZ = targetZ ?? camZ + focalLength;
      const targetDepth = tZ - camZ;
      let dirX = screenX;
      let dirY = screenY;
      let dirZ = focalLength;
      const radZ = rotZ * Math.PI / 180;
      const radX = rotX * Math.PI / 180;
      const radY = rotY * Math.PI / 180;
      if (radZ !== 0) {
        const c = Math.cos(radZ), s = Math.sin(radZ);
        const nx = dirX * c - dirY * s;
        const ny = dirX * s + dirY * c;
        dirX = nx;
        dirY = ny;
      }
      if (radX !== 0) {
        const c = Math.cos(radX), s = Math.sin(radX);
        const ny = dirY * c - dirZ * s;
        const nz = dirY * s + dirZ * c;
        dirY = ny;
        dirZ = nz;
      }
      if (radY !== 0) {
        const c = Math.cos(radY), s = Math.sin(radY);
        const nx = dirX * c + dirZ * s;
        const nz = -dirX * s + dirZ * c;
        dirX = nx;
        dirZ = nz;
      }
      let t = 1;
      if (dirZ !== 0) {
        t = (tZ - camZ) / dirZ;
      }
      const dx = dirX * t;
      const dy = dirY * t;
      const dz = dirZ * t;
      return {
        x: camX + dx,
        y: camY + dy,
        z: camZ + dz
      };
    }
    /**
     * 캔버스의 x, y 좌표를 카메라 기준의 로컬 좌표계로 변환합니다.
     * 결과값은 카메라 내부의 자식(child)으로 배치할 때의 좌표입니다.
     * @param x 캔버스 좌측 상단을 0으로 하는 x 좌표
     * @param y 캔버스 좌측 상단을 0으로 하는 y 좌표
     * @param targetZ (선택) 투영하고자 하는 로컬 공간의 Z 좌표. 지정하지 않으면 카메라 초점 거리(focalLength)로 계산됩니다.
     */
    canvasToLocal(x, y, targetZ) {
      const w = this.__world?.["_canvas"]?.width ?? window.innerWidth;
      const h = this.__world?.["_canvas"]?.height ?? window.innerHeight;
      const screenX = x - w / 2;
      const screenY = -(y - h / 2);
      const focalLength = this.attribute.focalLength ?? 100;
      const targetDepth = targetZ ?? focalLength;
      const scale5 = targetDepth / focalLength;
      let dx = screenX * scale5;
      let dy = screenY * scale5;
      return {
        x: dx,
        y: dy,
        z: targetDepth
      };
    }
    /**
     * targetZ 깊이에 있는 대상이 화면에서 value 크기만큼 보이려면
     * 실제 크기가 얼마가 되어야 하는지 원근 비율을 수학적으로 계산해 반환합니다.
     * @param targetZ 목표 Z 좌표
     * @param value 기준 크기 (화면에 보여질 목표 크기)
     */
    calcDepthRatio(targetZ, value) {
      const depth = targetZ - this.transform.position.z;
      const focalLength = this.attribute.focalLength ?? 100;
      const scale5 = depth === 0 ? 1 : focalLength / depth;
      if (scale5 === 0) return value;
      return value / scale5;
    }
  };
  var Rectangle = class extends LeviarObject {
    constructor(options) {
      super("rectangle", options);
    }
  };
  var Ellipse = class extends LeviarObject {
    constructor(options) {
      super("ellipse", options);
    }
  };
  var TextTransition = class extends BaseTransition {
    constructor(target) {
      super(target);
    }
    start(newText, charDurationMs) {
      if (this._anim) this._anim.stop();
      if (charDurationMs <= 0) {
        this.target.attribute.text = newText;
        this.target.__transitionProgress = 1;
        this.target.__dirtyTexture = true;
        return this;
      }
      this.target.attribute.text = newText;
      this.target.__transitionProgress = 0;
      this.target.__dirtyTexture = true;
      const pureTextLength = newText.replace(/<[^>]*>/g, "").length;
      const totalDurationMs = pureTextLength * charDurationMs;
      this._startTransition(
        totalDurationMs,
        "linear",
        (progress) => {
          this.target.__transitionProgress = progress;
          this.target.__dirtyTexture = true;
        },
        () => {
          this.target.__transitionProgress = 1;
          this.target.__dirtyTexture = true;
        }
      );
      return this;
    }
  };
  var Text = class extends LeviarObject {
    /** 트랜지션 진행도 (0 ~ 1, 1이면 완료 또는 미실행) */
    __transitionProgress = 1;
    /** 전환 관리자 */
    transitioner;
    constructor(options) {
      super("text", options);
    }
    /**
     * 지정된 속도로 텍스트가 글자 단위로 타이핑되듯 서서히 나타나는 효과를 줍니다.
     * @param newText 변경할 새 텍스트
     * @param charDurationMs 글자 1개당 나타나는데 걸리는 시간(밀리초)
     */
    transition(newText, charDurationMs) {
      if (!this.transitioner) {
        this.transitioner = new TextTransition(this);
      }
      this.transitioner.start(newText, charDurationMs);
      return this.transitioner;
    }
  };
  var ImageTransition = class extends BaseTransition {
    constructor(target) {
      super(target);
    }
    start(newSrc, durationMs) {
      if (this._anim) this._anim.stop();
      if (!this.target.attribute?.src || durationMs <= 0 || this.target.attribute.src === newSrc) {
        this.target.attribute.src = newSrc;
        this.target.__transitionOldSrc = null;
        this.target.__transitionProgress = 0;
        return this;
      }
      this.target.__transitionOldSrc = this.target.attribute.src;
      this.target.__transitionProgress = 0;
      this.target.attribute.src = newSrc;
      this._startTransition(
        durationMs,
        "linear",
        (progress) => {
          this.target.__transitionProgress = progress;
        },
        () => {
          this.target.__transitionOldSrc = null;
          this.target.__transitionProgress = 0;
        }
      );
      return this;
    }
  };
  var LeviarImage = class extends LeviarObject {
    /** 트랜지션용 과거 에셋 키 */
    __transitionOldSrc = null;
    /** 트랜지션 진행도 (0 ~ 1) */
    __transitionProgress = 0;
    /** 전환 관리자 */
    transitioner;
    constructor(options) {
      super("image", options);
    }
    /**
     * 새 이미지로 서서히 변경(크로스페이드)되는 애니메이션 효과를 줍니다.
     * @param newSrc 변경할 새 에셋 키
     * @param durationMs 전환에 걸리는 시간(밀리초)
     */
    transition(newSrc, durationMs) {
      if (!this.transitioner) {
        this.transitioner = new ImageTransition(this);
      }
      this.transitioner.start(newSrc, durationMs);
      return this.transitioner;
    }
  };
  var DELEGATED_KEYS = ["src", "currentTime", "playbackRate", "volume"];
  var LeviarVideo = class _LeviarVideo extends LeviarObject {
    /** 연결된 VideoManager */
    manager = null;
    /** 현재 재생 중인 클립 이름 */
    clipName = null;
    /** 현재 클립 정보 (Renderer에서 직접 참조) */
    __clip = null;
    /** 생성자 시점에 __manager가 없어서 보류된 src 값 */
    pendingSrc = null;
    /** 현재 재생할 에셋 키 (Renderer에서 직접 참조) */
    __src = null;
    /** Renderer에서 활성화된 실제 VideoElement 인스턴스 참조 */
    __videoElement = null;
    /** 재생 중 여부 */
    __playing = false;
    /** 일시정지 여부 */
    __paused = false;
    /** 재생 시작 시 시작 위치로 이동해야하는지 여부 (Renderer에서 참조 및 리셋) */
    __needsSeekToStart = false;
    /** currentTime setter에서 __videoElement가 null일 때 대기 중인 seek 값 (Renderer에서 적용 후 null로 리셋) */
    __pendingSeek = null;
    static DELEGATED_GETTERS = {
      src: (self) => self.clipName ?? void 0,
      currentTime: (self) => self.__videoElement?.currentTime ?? 0,
      playbackRate: (self) => self.__videoElement?.playbackRate ?? 1,
      volume: (self) => self.__videoElement?.volume ?? 1
    };
    static DELEGATED_SETTERS = {
      src: (self, value) => {
        if (!self.manager) {
          console.warn("[LeviarVideo] __setManager()\uB97C \uBA3C\uC800 \uD638\uCD9C\uD558\uC2ED\uC2DC\uC624.");
          return;
        }
        const clip = self.manager.get(value);
        if (!clip) {
          console.warn(`[LeviarVideo] \uD074\uB9BD '${value}'\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
          return;
        }
        self.clipName = value;
        self.__clip = clip;
        self.__src = clip.src;
        self.__playing = false;
        self.__paused = false;
        self.__needsSeekToStart = true;
        if (self.__videoElement) self.__videoElement.currentTime = 0;
        else self.__pendingSeek = 0;
      },
      currentTime: (self, value) => {
        self.__needsSeekToStart = false;
        if (self.__videoElement) {
          self.__videoElement.currentTime = value;
        } else {
          self.__pendingSeek = value;
        }
      },
      playbackRate: (self, value) => {
        if (self.__videoElement) self.__videoElement.playbackRate = value;
      },
      volume: (self, value) => {
        if (self.__videoElement) self.__videoElement.volume = Math.max(0, Math.min(1, value));
      }
    };
    constructor(options) {
      super("video", options, DELEGATED_KEYS);
      this.pendingSrc = options?.attribute?.src ?? null;
    }
    /**
     * VideoManager를 연결합니다.
     */
    __setManager(manager) {
      this.manager = manager;
      if (this.pendingSrc) {
        this.attribute.src = this.pendingSrc;
        this.pendingSrc = null;
      }
      return this;
    }
    /**
     * 저장된 비디오 클립을 재생합니다.
     */
    play() {
      if (!this.__clip) {
        console.warn("[LeviarVideo] src \uC18D\uC131\uC744 \uBA3C\uC800 \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      this.__playing = true;
      this.__paused = false;
      this.emit("play");
      return this;
    }
    /**
     * 재생을 일시정지합니다.
     */
    pause() {
      if (!this.__playing || this.__paused) return this;
      this.__paused = true;
      this.__playing = false;
      this.emit("pause");
      return this;
    }
    /**
     * 재생을 정지하고 처음으로 되돌립니다. loop=false일 때 'ended'를 emit합니다.
     */
    stop() {
      const wasPlaying = this.__playing;
      this.__playing = false;
      this.__paused = false;
      this.__needsSeekToStart = true;
      if (this.__videoElement) {
        this.__videoElement.currentTime = 0;
      } else {
        this.__pendingSeek = 0;
      }
      if (wasPlaying && this.__clip && !this.__clip.loop) {
        this.emit("ended");
      }
      return this;
    }
    /**
     * Renderer에서 루프 완료 시 호출 — 'repeat' 이벤트를 emit합니다.
     * @internal
     */
    __onRepeat() {
      this.emit("repeat");
    }
    /**
     * Renderer에서 재생 종료 시 호출 — 'ended' 이벤트를 emit합니다.
     * @internal
     */
    __onEnded() {
      this.__playing = false;
      this.emit("ended");
    }
    _getDelegatedAttribute(key) {
      const handler = _LeviarVideo.DELEGATED_GETTERS[key];
      if (handler) return handler(this);
      return super._getDelegatedAttribute(key);
    }
    _setDelegatedAttribute(key, value) {
      const handler = _LeviarVideo.DELEGATED_SETTERS[key];
      if (handler) {
        handler(this, value);
      } else {
        super._setDelegatedAttribute(key, value);
      }
    }
  };
  var DELEGATED_KEYS2 = ["src", "currentTime", "playbackRate"];
  var Sprite = class _Sprite extends LeviarObject {
    /** 연결된 SpriteManager */
    manager = null;
    /** 현재 재생 중인 클립 이름 */
    clipName = null;
    /** 현재 클립 정보 (Renderer에서 직접 참조) */
    __clip = null;
    /** 생성자 시점에 __manager가 없어서 보류된 src 값 */
    pendingSrc = null;
    /** 커스텀 재생 속도 (fps). undefined면 clip의 frameRate 사용 */
    __playbackRate;
    /** 현재 프레임 인덱스 (clip.start 기준 절대 인덱스) */
    __currentFrame = 0;
    /** 마지막 프레임 변경 시각 (rAF timestamp) */
    __lastFrameTime = 0;
    /** 재생 중 여부 */
    __playing = false;
    /** 일시정지 여부 */
    __paused = false;
    static DELEGATED_GETTERS = {
      src: (self) => self.clipName ?? void 0,
      currentTime: (self) => self.__clip ? Math.max(0, self.__currentFrame - self.__clip.start) : 0,
      playbackRate: (self) => self.__playbackRate ?? (self.__clip ? self.__clip.frameRate : 0)
    };
    static DELEGATED_SETTERS = {
      src: (self, value) => {
        if (!self.manager) {
          console.warn("[Sprite] __setManager()\uB97C \uBA3C\uC800 \uD638\uCD9C\uD558\uC2ED\uC2DC\uC624.");
          return;
        }
        const clip = self.manager.get(value);
        if (!clip) {
          console.warn(`[Sprite] \uD074\uB9BD '${value}'\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
          return;
        }
        self.clipName = value;
        self.__clip = clip;
        self.__currentFrame = clip.start;
        self.__lastFrameTime = 0;
        self.__playing = false;
        self.__paused = false;
      },
      currentTime: (self, value) => {
        if (!self.__clip) return;
        self.__currentFrame = self.__clip.start + Math.floor(value);
        if (self.__currentFrame >= self.__clip.end) self.__currentFrame = self.__clip.end - 1;
        if (self.__currentFrame < self.__clip.start) self.__currentFrame = self.__clip.start;
      },
      playbackRate: (self, value) => {
        self.__playbackRate = value;
      }
    };
    constructor(options) {
      super("sprite", options, DELEGATED_KEYS2);
      this.pendingSrc = options?.attribute?.src ?? null;
    }
    /**
     * SpriteManager를 연결합니다.
     */
    __setManager(manager) {
      this.manager = manager;
      if (this.pendingSrc) {
        this.attribute.src = this.pendingSrc;
        this.pendingSrc = null;
      }
      return this;
    }
    /**
     * 애니메이션 클립을 재생합니다.
     */
    play() {
      if (!this.__clip) {
        console.warn("[Sprite] src \uC18D\uC131\uC744 \uBA3C\uC800 \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      if (this.__playing && !this.__paused) return this;
      this.__playing = true;
      this.__paused = false;
      this.__lastFrameTime = 0;
      this.emit("play");
      return this;
    }
    /** 재생을 일시정지합니다. */
    pause() {
      if (!this.__playing || this.__paused) return this;
      this.__paused = true;
      this.emit("pause");
      return this;
    }
    /** 애니메이션을 정지하고 처음으로 되돌립니다. */
    stop() {
      this.__playing = false;
      this.__paused = false;
      if (this.__clip) {
        this.__currentFrame = this.__clip.start;
        this.__lastFrameTime = 0;
      }
      return this;
    }
    /**
     * Renderer에서 매 프레임 호출하여 현재 프레임 인덱스를 업데이트합니다.
     */
    __tick(timestamp) {
      if (!this.__playing || this.__paused || !this.__clip) return;
      const { frameRate, start, end, loop } = this.__clip;
      const targetFps = this.__playbackRate !== void 0 ? this.__playbackRate : frameRate;
      const interval = 1e3 / targetFps;
      if (this.__lastFrameTime === 0) {
        this.__lastFrameTime = timestamp;
        return;
      }
      if (timestamp - this.__lastFrameTime >= interval) {
        this.__currentFrame++;
        this.__lastFrameTime = timestamp;
        if (this.__currentFrame >= end) {
          if (loop) {
            this.__currentFrame = start;
            this.emit("repeat");
          } else {
            this.__currentFrame = end - 1;
            this.__playing = false;
            this.emit("ended");
          }
        }
      }
    }
    _getDelegatedAttribute(key) {
      const handler = _Sprite.DELEGATED_GETTERS[key];
      if (handler) return handler(this);
      return super._getDelegatedAttribute(key);
    }
    _setDelegatedAttribute(key, value) {
      const handler = _Sprite.DELEGATED_SETTERS[key];
      if (handler) {
        handler(this, value);
      } else {
        super._setDelegatedAttribute(key, value);
      }
    }
  };
  var import_matter_js = __toESM(require_matter(), 1);
  var DELEGATED_KEYS3 = ["src"];
  var GRAVITY = 1e-3;
  var Particle = class _Particle extends LeviarObject {
    manager = null;
    clipName = null;
    __clip = null;
    /** 생성자 시점에 __manager가 없어서 보류된 src 값 */
    pendingSrc = null;
    /** 활성 파티클 인스턴스 목록 (Renderer에서 직접 참조) */
    __instances = [];
    playing = false;
    lastSpawnTime = 0;
    spawnCount = 0;
    // loop=false 일 때 총 스폰 횟수 추적
    /** PhysicsEngine 참조 (strict 모드 전용) */
    physics = null;
    /** 일시정지 여부 */
    paused = false;
    static DELEGATED_GETTERS = {
      src: (self) => self.clipName ?? void 0
    };
    static DELEGATED_SETTERS = {
      src: (self, value) => {
        if (!self.manager) {
          console.warn("[Particle] __setManager()\uB97C \uBA3C\uC800 \uD638\uCD9C\uD558\uC2ED\uC2DC\uC624.");
          return;
        }
        const clip = self.manager.get(value);
        if (!clip) {
          console.warn(`[Particle] \uD074\uB9BD '${value}'\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
          return;
        }
        self.clipName = value;
        self.__clip = clip;
        self.playing = false;
        self.paused = false;
        self.lastSpawnTime = 0;
        self.spawnCount = 0;
        self.__instances = [];
      }
    };
    constructor(options) {
      super("particle", options, DELEGATED_KEYS3);
      this.pendingSrc = options?.attribute?.src ?? null;
    }
    /**
     * ParticleManager를 연결합니다.
     */
    __setManager(manager) {
      this.manager = manager;
      if (this.pendingSrc) {
        this.attribute.src = this.pendingSrc;
        this.pendingSrc = null;
      }
      return this;
    }
    /**
     * PhysicsEngine을 연결합니다. strict=true 시 필요합니다.
     */
    __setPhysics(physics) {
      this.physics = physics;
      return this;
    }
    /**
     * 파티클 에미션을 시작합니다.
     */
    play() {
      if (!this.__clip) {
        console.warn("[Particle] src \uC18D\uC131\uC744 \uBA3C\uC800 \uC124\uC815\uD558\uC2ED\uC2DC\uC624.");
        return this;
      }
      this.playing = true;
      this.paused = false;
      this.emit("play");
      return this;
    }
    /**
     * 파티클 에미션을 일시정지합니다.
     */
    pause() {
      if (!this.playing || this.paused) return this;
      this.paused = true;
      this.emit("pause");
      return this;
    }
    /**
     * 파티클 에미션을 정지합니다. 이미 생성된 인스턴스는 lifespan까지 유지됩니다.
     */
    stop() {
      if (!this.playing && !this.paused) return this;
      const wasLooping = this.__clip?.loop ?? false;
      this.playing = false;
      this.paused = false;
      if (wasLooping) {
        this.emit("repeat");
      } else {
        this.emit("ended");
      }
      return this;
    }
    /**
     * Renderer에서 매 프레임 호출합니다.
     * 인스턴스 생성/업데이트/제거를 처리합니다.
     */
    __tick(timestamp) {
      if (!this.__clip) return;
      const clip = this.__clip;
      if (this.lastSpawnTime === 0) {
        this.lastSpawnTime = timestamp;
      }
      if (this.playing && !this.paused) {
        const elapsed = timestamp - this.lastSpawnTime;
        if (elapsed >= clip.interval) {
          this._spawn(timestamp);
          this.lastSpawnTime = timestamp;
          this.spawnCount++;
          if (!clip.loop) {
            this.playing = false;
          }
        }
      }
      const gScale = this.attribute.gravityScale ?? 1;
      const gX = this.physics ? this.physics.engine.gravity.x * this.physics.engine.gravity.scale : 0;
      const gY = this.physics ? this.physics.engine.gravity.y * this.physics.engine.gravity.scale : GRAVITY;
      const alive = [];
      for (const inst of this.__instances) {
        const age = timestamp - inst.born;
        if (age >= inst.lifespan) {
          if (inst.body && this.physics) {
            this._removeInstanceBody(inst);
          }
          continue;
        }
        if (!inst.body) {
          const stepDt = timestamp - (inst.lastTick ?? inst.born);
          inst.lastTick = timestamp;
          if (stepDt > 0) {
            const friction = this.attribute.frictionAir ?? 0;
            const frameRatio = stepDt / 16.666;
            const slip = Math.pow(Math.max(0, 1 - friction), frameRatio);
            inst.vx += gX * gScale * stepDt;
            inst.vy += gY * gScale * stepDt;
            inst.vx *= slip;
            inst.vy *= slip;
            inst.vz *= slip;
            inst.x += inst.vx * stepDt;
            inst.y += inst.vy * stepDt;
            inst.z += inst.vz * stepDt;
            inst.angle += inst.angularVelocity * stepDt;
          }
        } else {
          const emX = this.transform.position.x;
          const emY = this.transform.position.y;
          inst.x = inst.body.position.x - emX;
          inst.y = inst.body.position.y - emY;
          inst.z = inst.spawnZ;
          inst.angle = inst.body.angle;
        }
        alive.push(inst);
      }
      this.__instances = alive;
    }
    _spawn(timestamp) {
      const clip = this.__clip;
      const attr = this.attribute;
      const emX = this.transform.position.x;
      const emY = this.transform.position.y;
      const rangeX = clip.spawnX ?? 0;
      const rangeY = clip.spawnY ?? 0;
      const rangeZ = clip.spawnZ ?? 0;
      for (let i = 0; i < clip.rate; i++) {
        const angle2 = Math.random() * Math.PI * 2;
        const speed = Math.random() * clip.impulse;
        const sizes = [];
        if (clip.size && clip.size.length > 0) {
          for (const [min, max] of clip.size) {
            sizes.push(min + Math.random() * (max - min));
          }
        } else {
          sizes.push(1, 0);
        }
        const opacities = [];
        if (clip.opacity && clip.opacity.length > 0) {
          for (const [min, max] of clip.opacity) {
            opacities.push(min + Math.random() * (max - min));
          }
        } else {
          opacities.push(1, 0);
        }
        const offsetX = rangeX > 0 ? (Math.random() - 0.5) * rangeX : 0;
        const offsetY = rangeY > 0 ? (Math.random() - 0.5) * rangeY : 0;
        const offsetZ = rangeZ > 0 ? (Math.random() - 0.5) * rangeZ : 0;
        const angImpulse = clip.angularImpulse ?? 0;
        const angularVelocity = angImpulse > 0 ? (Math.random() * 2 - 1) * angImpulse : 0;
        const inst = {
          spawnX: offsetX,
          spawnY: offsetY,
          spawnZ: offsetZ,
          x: offsetX,
          y: offsetY,
          z: offsetZ,
          vx: Math.cos(angle2) * speed,
          vy: Math.sin(angle2) * speed,
          vz: 0,
          sizes,
          opacities,
          born: timestamp,
          lifespan: clip.lifespan,
          angle: 0,
          angularVelocity
        };
        if (this.attribute.strictPhysics && this.physics) {
          const pw = this.style.width ? Math.min(this.style.width, this.style.height ?? this.style.width) / 4 : 4;
          const bodyOpts = {
            density: attr.density ?? 1e-3,
            friction: attr.friction ?? 0,
            restitution: attr.restitution ?? 0.3,
            frictionAir: attr.frictionAir ?? 0.03,
            collisionFilter: {
              group: attr.collisionGroup ?? -1,
              mask: attr.collisionMask ?? 4294967295,
              category: attr.collisionCategory ?? 1
            }
          };
          const body = import_matter_js.default.Bodies.circle(emX + offsetX, emY + offsetY, Math.max(pw, 2), bodyOpts);
          if (attr.fixedRotation) import_matter_js.default.Body.setInertia(body, Infinity);
          if (attr.gravityScale != null) body.gravityScale = attr.gravityScale;
          import_matter_js.default.Body.setVelocity(body, { x: inst.vx * 16, y: inst.vy * 16 });
          if (angularVelocity !== 0) {
            import_matter_js.default.Body.setAngularVelocity(body, angularVelocity * 16);
          }
          import_matter_js.default.Composite.add(this.physics.engine.world, body);
          inst.body = body;
        }
        this.__instances.push(inst);
      }
    }
    _removeInstanceBody(inst) {
      if (!inst.body || !this.physics) return;
      import_matter_js.default.Composite.remove(this.physics.engine.world, inst.body);
      inst.body = void 0;
    }
    _getDelegatedAttribute(key) {
      const handler = _Particle.DELEGATED_GETTERS[key];
      if (handler) return handler(this);
      return super._getDelegatedAttribute(key);
    }
    _setDelegatedAttribute(key, value) {
      const handler = _Particle.DELEGATED_SETTERS[key];
      if (handler) {
        handler(this, value);
      } else {
        super._setDelegatedAttribute(key, value);
      }
    }
  };
  var AssetManager = class {
    clips = /* @__PURE__ */ new Map();
    /**
     * 이름으로 클립을 조회합니다.
     */
    get(name) {
      return this.clips.get(name);
    }
  };
  var SpriteManager = class extends AssetManager {
    /**
     * 애니메이션 클립을 등록합니다.
     */
    create(options) {
      this.clips.set(options.name, { ...options });
      return this;
    }
  };
  var VideoManager = class extends AssetManager {
    /**
     * 비디오 클립을 등록합니다.
     */
    create(options) {
      this.clips.set(options.name, { ...options });
      return this;
    }
  };
  var ParticleManager = class extends AssetManager {
    create(options) {
      this.clips.set(options.name, { ...options });
      return this;
    }
  };
  var import_matter_js2 = __toESM(require_matter(), 1);
  function parseMargin(margin) {
    if (!margin) return { top: 0, right: 0, bottom: 0, left: 0 };
    const parts = margin.trim().split(/\s+/).map(Number);
    if (parts.some(isNaN)) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (parts.length === 1) {
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    } else if (parts.length === 2) {
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    } else if (parts.length === 3) {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    } else {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    }
  }
  globalThis.__Matter__ = import_matter_js2.default;
  var PhysicsEngine = class {
    engine;
    bodyMap = /* @__PURE__ */ new Map();
    objMap = /* @__PURE__ */ new Map();
    prevTime = 0;
    /** syncObjectSizes에서 크기 변경 감지용 - border/margin 제외한 순수 w, h */
    lastSizeMap = /* @__PURE__ */ new Map();
    /** Z → 양수 그룹 번호 매핑 (1-based). 같은 Z = 같은 양수 그룹 = 충돌, 다른 Z = 다른 그룹 = 차단 */
    zGroupMap = /* @__PURE__ */ new Map();
    nextZGroup = 1;
    constructor() {
      this.engine = import_matter_js2.default.Engine.create();
      this.engine.gravity.y = -1;
      import_matter_js2.default.Events.on(this.engine, "beforeUpdate", () => {
        const gravity = this.engine.gravity;
        for (const body of import_matter_js2.default.Composite.allBodies(this.engine.world)) {
          const scale5 = body.gravityScale;
          if (scale5 !== void 0 && scale5 !== 1 && !body.isStatic) {
            const m = body.mass;
            body.force.x += m * gravity.x * gravity.scale * (scale5 - 1);
            body.force.y += m * gravity.y * gravity.scale * (scale5 - 1);
          }
        }
      });
    }
    /**
     * LeviarObject를 물리 바디로 등록합니다.
     * attribute.physics에 따라 dynamic / static 바디를 생성합니다.
     */
    addBody(obj, w, h) {
      if (!obj.attribute.physics) return;
      const { x, y } = obj.transform.position;
      const attr = obj.attribute;
      const m = parseMargin(obj.style.margin);
      const bw = (obj.style.borderWidth ?? 0) * 2;
      const baseW = w || 32;
      const baseH = h || 32;
      const physW = baseW + m.left + m.right + bw;
      const physH = baseH + m.top + m.bottom + bw;
      const options = {
        isStatic: attr.physics === "static",
        density: attr.density ?? 1e-3,
        friction: attr.friction ?? 0.1,
        restitution: attr.restitution ?? 0,
        frictionAir: attr.frictionAir ?? 0.01,
        collisionFilter: {
          group: attr.collisionGroup ?? 0,
          mask: attr.collisionMask ?? 4294967295,
          category: attr.collisionCategory ?? 1
        },
        angle: (obj.transform.rotation.z || 0) * Math.PI / 180
      };
      const pivotOffsetX = (0.5 - obj.transform.pivot.x) * baseW;
      const pivotOffsetY = -(0.5 - obj.transform.pivot.y) * baseH;
      const marginOffsetX = (m.right - m.left) / 2;
      const marginOffsetY = (m.top - m.bottom) / 2;
      const localCenterX = pivotOffsetX + marginOffsetX;
      const localCenterY = pivotOffsetY + marginOffsetY;
      const angle2 = options.angle;
      const cos = Math.cos(angle2);
      const sin = Math.sin(angle2);
      const worldCenterX = x + localCenterX * cos - localCenterY * sin;
      const worldCenterY = y + localCenterX * sin + localCenterY * cos;
      let body;
      if (obj.attribute.type === "ellipse") {
        const r = Math.min(physW, physH) / 2;
        body = import_matter_js2.default.Bodies.circle(worldCenterX, worldCenterY, r, options);
      } else {
        body = import_matter_js2.default.Bodies.rectangle(worldCenterX, worldCenterY, physW, physH, options);
      }
      if (attr.fixedRotation) {
        import_matter_js2.default.Body.setInertia(body, Infinity);
      }
      if (attr.gravityScale != null) {
        ;
        body.gravityScale = attr.gravityScale;
      }
      obj.__body = body;
      this.bodyMap.set(obj.attribute.id, body);
      this.objMap.set(obj.attribute.id, obj);
      import_matter_js2.default.Composite.add(this.engine.world, body);
    }
    /**
     * 물리 바디의 크기를 재계산하여 재생성합니다.
     * 현재 위치, 속도, 각도를 유지합니다.
     * w, h는 style.width * scale, style.height * scale 기준 (margin/border 미포함)
     */
    updateBodySize(obj, w, h) {
      const prevBody = this.bodyMap.get(obj.attribute.id);
      if (!prevBody) return;
      const pos = { ...prevBody.position };
      const vel = { ...prevBody.velocity };
      const angle2 = prevBody.angle;
      const angularVelocity = prevBody.angularVelocity;
      import_matter_js2.default.Composite.remove(this.engine.world, prevBody);
      this.bodyMap.delete(obj.attribute.id);
      obj.__body = null;
      const savedX = obj.transform.position.x;
      const savedY = obj.transform.position.y;
      obj.transform.position.x = pos.x;
      obj.transform.position.y = pos.y;
      this.addBody(obj, w, h);
      obj.transform.position.x = savedX;
      obj.transform.position.y = savedY;
      const newBody = this.bodyMap.get(obj.attribute.id);
      if (!newBody) return;
      import_matter_js2.default.Body.setPosition(newBody, pos);
      import_matter_js2.default.Body.setVelocity(newBody, vel);
      import_matter_js2.default.Body.setAngle(newBody, angle2);
      import_matter_js2.default.Body.setAngularVelocity(newBody, angularVelocity);
    }
    /**
     * LeviarObject._renderedSize 기반으로 물리 바디 크기를 동기화합니다.
     * dirty + 디바운스(개혁) 또는 스로틄(강제) 조건 달성 시에만 크기를 재확인합니다.
     */
    syncObjectSizes(objects) {
      const EPS = 0.5;
      for (const obj of objects) {
        if (!obj.__body || !obj.__renderedSize) continue;
        obj.__physicsThrottleCount++;
        if (obj.__dirtyPhysics) obj.__physicsIdleCount++;
        const shouldCheck = obj.__dirtyPhysics && (obj.__physicsIdleCount >= PHYSICS_DEBOUNCE_FRAMES || obj.__physicsThrottleCount >= PHYSICS_THROTTLE_FRAMES);
        if (!shouldCheck) continue;
        obj.__dirtyPhysics = false;
        obj.__physicsIdleCount = 0;
        obj.__physicsThrottleCount = 0;
        const { w, h } = obj.__renderedSize;
        const last = this.lastSizeMap.get(obj.attribute.id);
        if (last && Math.abs(last.w - w) < EPS && Math.abs(last.h - h) < EPS) continue;
        this.lastSizeMap.set(obj.attribute.id, { w, h });
        this.updateBodySize(obj, w, h);
      }
    }
    /**
     * LeviarObject의 물리 바디를 제거합니다.
     */
    removeBody(obj) {
      const body = this.bodyMap.get(obj.attribute.id);
      if (!body) return;
      import_matter_js2.default.Composite.remove(this.engine.world, body);
      this.bodyMap.delete(obj.attribute.id);
      this.objMap.delete(obj.attribute.id);
      this.lastSizeMap.delete(obj.attribute.id);
      obj.__body = null;
    }
    /**
     * 특정 오브젝트에 힘을 적용합니다.
     */
    applyForce(obj, force) {
      if (!obj.__body) return;
      import_matter_js2.default.Body.applyForce(obj.__body, obj.__body.position, force);
    }
    /**
     * 특정 오브젝트의 속도를 설정합니다.
     */
    setVelocity(obj, velocity) {
      if (!obj.__body) return;
      import_matter_js2.default.Body.setVelocity(obj.__body, velocity);
    }
    /**
     * 물리 시뮬레이션을 진행하고, 바디 위치를 LeviarObject에 동기화합니다.
     * @param timestamp requestAnimationFrame의 타임스탬프
     */
    step(timestamp) {
      if (this.prevTime === 0) {
        this.prevTime = timestamp;
        return;
      }
      const delta = Math.min(timestamp - this.prevTime, 50);
      this.prevTime = timestamp;
      this.updateZCollisionFilters();
      import_matter_js2.default.Engine.update(this.engine, delta);
      this.syncToObjects();
    }
    /**
     * 매 step 전, 오브젝트의 Z 좌표를 기반으로 collisionFilter.group을 동적으로 갱신합니다.
     * - 같은 Z → 같은 양수 group → matter-js 규칙상 무조건 충돌
     * - 다른 Z → 다른 group → category=0/mask=0 으로 충돌 차단
     * - 사용자가 attr.collisionGroup을 명시한 경우 Z 로직을 건너뜁니다.
     */
    updateZCollisionFilters() {
      for (const [id, body] of this.bodyMap) {
        const obj = this.objMap.get(id);
        if (!obj) continue;
        if (obj.attribute.collisionCategory != null || obj.attribute.collisionMask != null) continue;
        const z = obj.transform.position.z ?? 0;
        if (!this.zGroupMap.has(z)) {
          const bit = 1 << (this.nextZGroup++ - 1) % 31 + 1;
          this.zGroupMap.set(z, bit);
        }
        const category = this.zGroupMap.get(z);
        const cf = body.collisionFilter;
        if (cf.group !== 0 || cf.category !== category || cf.mask !== category) {
          import_matter_js2.default.Body.set(body, {
            collisionFilter: {
              group: obj.attribute.collisionGroup ?? 0,
              category,
              mask: category
            }
          });
        }
      }
    }
    /**
     * matter-js 바디의 위치/회전을 LeviarObject.transform에 반영합니다.
     */
    syncToObjects() {
      for (const [id, body] of this.bodyMap) {
        const obj = this.objMap.get(id);
        if (!obj) continue;
        const lastSize = this.lastSizeMap.get(id);
        let baseW = lastSize?.w ?? obj.__renderedSize?.w ?? obj.style.width;
        let baseH = lastSize?.h ?? obj.__renderedSize?.h ?? obj.style.height;
        if (!lastSize) {
          baseW = (baseW ?? 32) * obj.transform.scale.x;
          baseH = (baseH ?? 32) * obj.transform.scale.y;
        } else {
          baseW = baseW ?? 32;
          baseH = baseH ?? 32;
        }
        const m = parseMargin(obj.style.margin);
        const pivotOffsetX = (0.5 - obj.transform.pivot.x) * baseW;
        const pivotOffsetY = -(0.5 - obj.transform.pivot.y) * baseH;
        const marginOffsetX = (m.right - m.left) / 2;
        const marginOffsetY = (m.top - m.bottom) / 2;
        const localCenterX = pivotOffsetX + marginOffsetX;
        const localCenterY = pivotOffsetY + marginOffsetY;
        const cos = Math.cos(body.angle);
        const sin = Math.sin(body.angle);
        const rotatedOffsetX = localCenterX * cos - localCenterY * sin;
        const rotatedOffsetY = localCenterX * sin + localCenterY * cos;
        obj.transform.position.x = body.position.x - rotatedOffsetX;
        obj.transform.position.y = body.position.y - rotatedOffsetY;
        obj.transform.rotation.z = body.angle * 180 / Math.PI;
      }
    }
  };
  var colorVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var colorFragment = (
    /* glsl */
    `
  precision highp float;
  uniform vec4 uColor;
  uniform float uOpacity;
  uniform float uRadius;    // 0 = rectangle, 1 = ellipse (SDF) -- kept for legacy fallback or direct ellipse mapping
  uniform vec4 uBorderRadius; // [TR, BR, TL, BL]
  uniform vec2 uSize;       // \uB3C4\uD615 \uD53D\uC140 \uD06C\uAE30 (w, h)

  uniform float uIsBorder;
  uniform vec2 uInnerSize;
  uniform vec4 uInnerBorderRadius;

  varying vec2 vUV;

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }

  void main() {
    vec2 p = (vUV - 0.5) * uSize;
    if (uRadius > 0.5) {
      // \uD0C0\uC6D0\uC740 ellipseFragment \uC5D0\uC11C \uBCC4\uB3C4\uB85C \uCC98\uB9AC\uB418\uB098 \uD639\uC2DC \uBAA8\uB97C \uD3F4\uBC31 \uB300\uBE44
    } else {
      float d = sdRoundedBox(p, uSize * 0.5, uBorderRadius);
      if (d > 0.0) discard;

      if (uIsBorder > 0.5) {
        float innerD = sdRoundedBox(p, uInnerSize * 0.5, uInnerBorderRadius);
        if (innerD <= 0.0) discard;
      }
    }
    gl_FragColor = vec4(uColor.rgb * uColor.a * uOpacity, uColor.a * uOpacity);
  }
`
  );
  var ellipseVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var ellipseFragment = (
    /* glsl */
    `
  precision highp float;
  uniform vec4 uColor;
  uniform float uOpacity;

  uniform float uIsBorder;
  uniform vec2 uSize;
  uniform vec2 uInnerSize;

  varying vec2 vUV;

  void main() {
    // vUV \uBC94\uC704: [0, 1] \u2192 [-1, 1] \uB85C \uBCC0\uD658 \uD6C4 SDF
    vec2 p = vUV * 2.0 - 1.0;
    float d = dot(p, p);  // p.x^2 + p.y^2
    if (d > 1.0) discard;

    if (uIsBorder > 0.5) {
      vec2 pPix = (vUV - 0.5) * uSize;
      vec2 scaledP = pPix / (uInnerSize * 0.5);
      float innerD = dot(scaledP, scaledP);
      if (innerD <= 1.0) discard;
    }

    gl_FragColor = vec4(uColor.rgb * uColor.a * uOpacity, uColor.a * uOpacity);
  }
`
  );
  var textureVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform float uFlipY;
  uniform vec2 uUVOffset;
  uniform vec2 uUVScale;
  varying vec2 vUV;

  void main() {
    float y = uFlipY > 0.5 ? 1.0 - uv.y : uv.y;
    vUV = uUVOffset + vec2(uv.x, y) * uUVScale;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var textureFragment = (
    /* glsl */
    `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUV;

  void main() {
    vec4 color = texture2D(uTexture, vUV);
    gl_FragColor = vec4(color.rgb * color.a * uOpacity, color.a * uOpacity);
  }
`
  );
  var instancedVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;

  // instanced attributes (4x4 Model Matrix split into 4 vec4s)
  attribute vec4 instanceMat0;
  attribute vec4 instanceMat1;
  attribute vec4 instanceMat2;
  attribute vec4 instanceMat3;
  
  // x: opacity, y: flipY
  attribute vec2 instanceOpacityFlip;
  
  // x: uvOffsetX, y: uvOffsetY, z: uvScaleX, w: uvScaleY
  attribute vec4 instanceUVParams;
  
  // x: TR, y: BR, z: TL, w: BL
  attribute vec4 instanceBorderRadius;

  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec2 vUV;
  varying float vOpacity;
  varying vec2 vSize;
  varying vec4 vBorderRadius;
  varying vec2 vLocalUV;

  void main() {
    float flipY = instanceOpacityFlip.y;
    vec2 finalUV = uv;
    if (flipY > 0.0) {
      finalUV.y = 1.0 - finalUV.y;
    }
    
    // UV Offset & Scale
    vUV = finalUV * instanceUVParams.zw + instanceUVParams.xy;
    vLocalUV = uv;
    vOpacity = instanceOpacityFlip.x;
    vBorderRadius = instanceBorderRadius;
    
    float w = length(instanceMat0.xyz);
    float h = length(instanceMat1.xyz);
    vSize = vec2(w, h);
    
    mat4 modelMat = mat4(
      instanceMat0,
      instanceMat1,
      instanceMat2,
      instanceMat3
    );

    vec4 worldPos = modelMat * vec4(position, 0.0, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
  }
`
  );
  var instancedFragment = (
    /* glsl */
    `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 vUV;
  varying float vOpacity;
  varying vec2 vSize;
  varying vec4 vBorderRadius;
  varying vec2 vLocalUV;

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }

  void main() {
    float maxRad = max(max(vBorderRadius.x, vBorderRadius.y), max(vBorderRadius.z, vBorderRadius.w));
    if (maxRad > 0.0) {
      vec2 p = (vLocalUV - 0.5) * vSize;
      float d = sdRoundedBox(p, vSize * 0.5, vBorderRadius);
      if (d > 0.0) discard;
    }

    vec4 color = texture2D(uTexture, vUV);
    gl_FragColor = vec4(color.rgb * color.a * vOpacity, color.a * vOpacity);
  }
`
  );
  var shadowVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var shadowFragment = (
    /* glsl */
    `
  precision highp float;
  uniform vec4 uColor;
  uniform float uOpacity;
  uniform vec2 uSize;      // Quad size (includes blur padding)
  uniform vec2 uBoxSize;   // Actual object size (w, h)
  uniform vec2 uOffset;    // [offsetX, offsetY]
  uniform float uBlur;
  uniform float uSpread;
  uniform float uIsEllipse;
  uniform vec4 uBorderRadius; // [TR, BR, TL, BL]
  varying vec2 vUV;

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }

  void main() {
    // p is pixel mapped: center of the object is (0,0)
    vec2 p = (vUV - 0.5) * uSize;
    
    // Shadow center is offset from the object center
    // We negate uOffset.y because WebGL UV +y is typically UP, whereas CSS offset +y is DOWN.
    vec2 shadowP = p - vec2(uOffset.x, -uOffset.y);
    
    float d = 0.0;
    float innerMask = 0.0;
    vec2 radius = uBoxSize * 0.5;

    if (uIsEllipse > 0.5) {
      if (radius.x <= 0.0 || radius.y <= 0.0) {
         discard;
      }
      vec2 scaledShadowP = shadowP / radius;
      d = (length(scaledShadowP) - 1.0) * min(radius.x, radius.y);
      
      vec2 scaledInnerP = p / radius;
      innerMask = (length(scaledInnerP) - 1.0) * min(radius.x, radius.y);
    } else {
      d = sdRoundedBox(shadowP, radius, uBorderRadius);
      innerMask = sdRoundedBox(p, radius, uBorderRadius);
    }

    // Apply shadow spread
    d -= uSpread;

    float alpha = 1.0;
    if (uBlur > 0.0) {
      alpha = 1.0 - smoothstep(-uBlur, uBlur, d);
    } else {
      alpha = step(d, 0.0);
    }

    // Discard pixels that are INSIDE the actual box! (Hollow out the center)
    if (innerMask <= 0.0) discard;

    if (alpha <= 0.0) discard;

    float finalAlpha = uColor.a * uOpacity * alpha;
    gl_FragColor = vec4(uColor.rgb * finalAlpha, finalAlpha);
  }
`
  );
  var MAX_RADIUS = 16;
  var alphaOutlineVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var alphaOutlineFragment = (
    /* glsl */
    `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uAlphaThreshold;

  uniform vec2 uUVOffset;
  uniform vec2 uUVScale;

  // \uD655\uC7A5 \uCFFC\uB4DC \u2192 \uC774\uBBF8\uC9C0 UV \uBCC0\uD658 \uD30C\uB77C\uBBF8\uD130
  uniform vec2 uImageOffset; // \uD655\uC7A5 \uCFFC\uB4DC UV\uC5D0\uC11C \uC774\uBBF8\uC9C0 \uC2DC\uC791\uC810 (pad/expandedW)
  uniform vec2 uImageScale;  // \uD655\uC7A5 \uCFFC\uB4DC UV\uC5D0\uC11C \uC774\uBBF8\uC9C0\uAC00 \uCC28\uC9C0\uD558\uB294 \uBE44\uC728 (drawW/expandedW)

  // \uC774\uBBF8\uC9C0 UV \uACF5\uAC04\uC5D0\uC11C 1 world pixel \uD06C\uAE30 = vec2(1/drawW, 1/drawH)
  uniform vec2 uTexelStep;

  uniform float uBorderWidth;  // world pixels
  uniform vec4  uBorderColor;  // premultiplied-ready RGBA
  uniform float uOutlineWidth; // world pixels
  uniform vec4  uOutlineColor; // premultiplied-ready RGBA

  varying vec2 vUV;

  #define MAX_RADIUS ${MAX_RADIUS}

  void main() {
    // 1. \uD655\uC7A5 \uCFFC\uB4DC UV \u2192 \uC774\uBBF8\uC9C0 UV \uBCC0\uD658
    vec2 imageUV = (vUV - uImageOffset) / uImageScale;
    bool inImage = imageUV.x >= 0.0 && imageUV.x <= 1.0
                && imageUV.y >= 0.0 && imageUV.y <= 1.0;

    // 2. \uC774\uBBF8\uC9C0 \uB0B4 \uBD88\uD22C\uBA85 \uD53D\uC140\uC740 main texture \uD328\uC2A4\uC5D0\uC11C \uB80C\uB354\uB428 \u2192 \uC5EC\uAE30\uC120 \uC81C\uC678
    if (inImage) {
      vec2 texUV = imageUV * uUVScale + uUVOffset;
      if (texture2D(uTexture, texUV).a > uAlphaThreshold) {
        discard;
      }
    }

    // 3. \uC778\uC811 \uD53D\uC140 \uD0D0\uC0C9: \uBD88\uD22C\uBA85 \uD53D\uC140\uAE4C\uC9C0\uC758 \uCD5C\uC18C \uAC70\uB9AC(world pixels)
    float searchR = uBorderWidth + uOutlineWidth;
    float minDist = 99999.0;

    for (int dx = -MAX_RADIUS; dx <= MAX_RADIUS; dx++) {
      for (int dy = -MAX_RADIUS; dy <= MAX_RADIUS; dy++) {
        float d = length(vec2(float(dx), float(dy)));
        if (d > searchR) continue;
        vec2 sUV = imageUV + vec2(float(dx), float(dy)) * uTexelStep;
        if (sUV.x < 0.0 || sUV.x > 1.0 || sUV.y < 0.0 || sUV.y > 1.0) continue;
        
        vec2 sTexUV = sUV * uUVScale + uUVOffset;
        if (texture2D(uTexture, sTexUV).a > uAlphaThreshold) {
          if (d < minDist) minDist = d;
        }
      }
    }

    if (minDist > searchR) {
      discard;
    }

    // 4. \uAC70\uB9AC \uAD6C\uAC04\uBCC4 \uC0C9\uC0C1 \uACB0\uC815 (border \u2192 outline \uC21C\uC11C)
    if (uBorderWidth > 0.0 && minDist <= uBorderWidth) {
      float a = uBorderColor.a * uOpacity;
      gl_FragColor = vec4(uBorderColor.rgb * a, a);
    } else if (uOutlineWidth > 0.0 && minDist <= searchR) {
      float a = uOutlineColor.a * uOpacity;
      gl_FragColor = vec4(uOutlineColor.rgb * a, a);
    } else {
      discard;
    }
  }
`
  );
  var alphaShadowVertex = (
    /* glsl */
    `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 0.0, 1.0);
  }
`
  );
  var alphaShadowFragment = (
    /* glsl */
    `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec4  uColor;          // \uADF8\uB9BC\uC790 \uC0C9\uC0C1 RGBA
  uniform float uOpacity;        // \uC804\uCCB4 \uBD88\uD22C\uBA85\uB3C4
  uniform vec2  uQuadSize;       // \uADF8\uB9BC\uC790 \uCFFC\uB4DC \uD06C\uAE30 (world units)
  uniform vec2  uImageSize;      // \uC774\uBBF8\uC9C0 \uD45C\uC2DC \uD06C\uAE30 (world units)
  uniform vec2  uOffset;         // CSS \uADF8\uB9BC\uC790 offset [x, y] (+y = down)
  uniform float uBlur;           // \uBE14\uB7EC \uBC18\uACBD (world units)
  uniform float uSpread;         // \uD655\uC7A5 \uBC18\uACBD (world units)
  uniform float uAlphaThreshold; // \uD53D\uC140\uC744 \uBD88\uD22C\uBA85\uC73C\uB85C \uD310\uB2E8\uD560 \uCD5C\uC19F\uAC12

  varying vec2 vUV;

  uniform vec2 uUVOffset;
  uniform vec2 uUVScale;

  // \uC774\uBBF8\uC9C0 UV \uBC94\uC704 \uD074\uB7A8\uD504 \uCCB4\uD06C
  bool inUV(vec2 uv) {
    return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  }

  // \uC6D4\uB4DC \uC88C\uD45C \u2192 \uC774\uBBF8\uC9C0 UV \uBCC0\uD658
  vec2 worldToImageUV(vec2 worldPos) {
    return (worldPos + uImageSize * 0.5) / uImageSize;
  }

  void main() {
    // \uADF8\uB9BC\uC790 \uCFFC\uB4DC \uC911\uC2EC \uAE30\uC900\uC758 \uD604\uC7AC \uD53D\uC140 \uC6D4\uB4DC \uC88C\uD45C
    vec2 p = (vUV - 0.5) * uQuadSize;

    // \uC774\uBBF8\uC9C0 \uBD88\uD22C\uBA85 \uC601\uC5ED \uC704\uB294 \uADF8\uB9BC\uC790 \uB80C\uB354 \uC81C\uC678
    vec2 imgUV = worldToImageUV(p);
    if (inUV(imgUV)) {
      vec2 texUV = imgUV * uUVScale + uUVOffset;
      if (texture2D(uTexture, texUV).a > uAlphaThreshold) {
        discard;
      }
    }

    // CSS \uADF8\uB9BC\uC790 offset \uC5ED\uBCC0\uD658: WebGL +y = up, CSS +y = down
    vec2 shadowSrcP = p - vec2(uOffset.x, -uOffset.y);

    // blur + spread \uB97C \uD569\uC0B0\uD558\uC5EC \uC720\uD6A8 \uBE14\uB7EC \uBC18\uACBD \uACC4\uC0B0
    float effectiveBlur = uBlur + uSpread;

    // \u2500\u2500 Gaussian \uB9C1 \uC0D8\uD50C\uB9C1 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // 1 center + 3 rings \xD7 8 samples = 25 samples
    float PI2 = 6.28318;
    float accAlpha = 0.0;
    float totalWeight = 0.0;

    // Ring 0: \uC911\uC2EC \uC0D8\uD50C (\uAC00\uC911\uCE58 \uCD5C\uB300)
    {
      float w = 1.0;
      vec2 sUV = worldToImageUV(shadowSrcP);
      if (inUV(sUV)) {
        vec2 texUV = sUV * uUVScale + uUVOffset;
        accAlpha += texture2D(uTexture, texUV).a * w;
      }
      totalWeight += w;
    }

    // Rings 1\u20133: \uC6D0\uC8FC \uBC29\uD5A5 8 \uC0D8\uD50C\uC529, Gaussian \uAC00\uC911\uCE58
    for (int ring = 1; ring <= 3; ring++) {
      float r = float(ring) * effectiveBlur / 3.0;
      float sigma = max(effectiveBlur / 2.0, 0.001);
      float w = exp(-r * r / (2.0 * sigma * sigma));

      for (int i = 0; i < 8; i++) {
        float angle = float(i) / 8.0 * PI2;
        vec2 s = shadowSrcP + vec2(cos(angle), sin(angle)) * r;
        vec2 sUV = worldToImageUV(s);
        if (inUV(sUV)) {
          vec2 texUV = sUV * uUVScale + uUVOffset;
          accAlpha += texture2D(uTexture, texUV).a * w;
        }
        totalWeight += w;
      }
    }

    float shadowAlpha = accAlpha / max(totalWeight, 0.001);
    if (shadowAlpha <= uAlphaThreshold) discard;

    float finalA = uColor.a * uOpacity * shadowAlpha;
    gl_FragColor = vec4(uColor.rgb * finalA, finalA);
  }
`
  );
  function parseAttrs(attrStr) {
    const style = {};
    const re = /(\w+)=["']([^"']*)["']/g;
    let m;
    while ((m = re.exec(attrStr)) != null) {
      const [, key, val] = m;
      switch (key) {
        case "fontSize":
          style.fontSize = parseFloat(val);
          break;
        case "fontWeight":
          style.fontWeight = val;
          break;
        case "fontStyle":
          style.fontStyle = val;
          break;
        case "color":
          style.color = val;
          break;
        case "borderColor":
          style.borderColor = val;
          break;
        case "borderWidth":
          style.borderWidth = parseFloat(val);
          break;
        case "letterSpacing":
          style.letterSpacing = parseFloat(val);
          break;
        case "lineHeight":
          style.lineHeight = parseFloat(val);
          break;
        case "textShadowColor":
          style.textShadowColor = val;
          break;
        case "textShadowBlur":
          style.textShadowBlur = parseFloat(val);
          break;
        case "textShadowOffsetX":
          style.textShadowOffsetX = parseFloat(val);
          break;
        case "textShadowOffsetY":
          style.textShadowOffsetY = parseFloat(val);
          break;
      }
    }
    return style;
  }
  var OPEN_RE = /<style([^>]*)>/;
  var CLOSE_RE = /<\/style>/;
  var TOKEN_RE = /(<style[^>]*>|<\/style>)/g;
  function parseTextMarkup(raw, baseStyle) {
    const spans = [];
    const stack = [baseStyle];
    const tokens = raw.split(TOKEN_RE);
    for (const token of tokens) {
      if (!token) continue;
      if (OPEN_RE.test(token)) {
        const attrMatch = token.match(OPEN_RE);
        const attrs = attrMatch ? parseAttrs(attrMatch[1]) : {};
        const parent = stack[stack.length - 1];
        stack.push({ ...parent, ...attrs });
      } else if (CLOSE_RE.test(token)) {
        if (stack.length > 1) stack.pop();
      } else {
        if (token) {
          spans.push({ text: token, style: { ...stack[stack.length - 1] } });
        }
      }
    }
    return spans;
  }
  function parseBorderRadius(value, w, h, bw = 0) {
    if (value == null) return [0, 0, 0, 0];
    let tl = 0, tr = 0, br = 0, bl = 0;
    if (typeof value === "number") {
      tl = tr = br = bl = value;
    } else {
      const tokens = value.trim().split(/\s+/);
      if (tokens.length === 0) return [0, 0, 0, 0];
      const parseToken = (t) => {
        if (t.endsWith("%")) {
          const p = parseFloat(t) / 100;
          return Math.min(w, h) * p;
        }
        return parseFloat(t) || 0;
      };
      const t0 = parseToken(tokens[0]);
      const t1 = tokens.length > 1 ? parseToken(tokens[1]) : t0;
      const t2 = tokens.length > 2 ? parseToken(tokens[2]) : t0;
      const t3 = tokens.length > 3 ? parseToken(tokens[3]) : t1;
      tl = t0;
      tr = t1;
      br = t2;
      bl = t3;
    }
    const expand = (r) => r === 0 ? 0 : Math.max(0, r + bw);
    return [expand(tl), expand(tr), expand(br), expand(bl)];
  }
  var AXIS_X = new Vec3(1, 0, 0);
  var AXIS_Y = new Vec3(0, 1, 0);
  var AXIS_Z = new Vec3(0, 0, 1);
  function createQuadGeometry(gl) {
    return new Geometry(gl, {
      position: {
        size: 2,
        data: new Float32Array([
          -0.5,
          -0.5,
          0.5,
          -0.5,
          0.5,
          0.5,
          -0.5,
          0.5
        ])
      },
      uv: {
        size: 2,
        data: new Float32Array([
          0,
          0,
          1,
          0,
          1,
          1,
          0,
          1
        ])
      },
      index: {
        data: new Uint16Array([0, 1, 2, 0, 2, 3])
      }
    });
  }
  function parseCSSColor(color) {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16) / 255;
        const g = parseInt(hex[1] + hex[1], 16) / 255;
        const b = parseInt(hex[2] + hex[2], 16) / 255;
        return [r, g, b, 1];
      }
      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
      }
    }
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]) / 255,
        parseInt(rgbMatch[2]) / 255,
        parseInt(rgbMatch[3]) / 255,
        rgbMatch[4] != null ? parseFloat(rgbMatch[4]) : 1
      ];
    }
    const hslMatch = color.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/);
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]) / 360;
      const s = parseFloat(hslMatch[2]) / 100;
      const l = parseFloat(hslMatch[3]) / 100;
      const a = hslMatch[4] != null ? parseFloat(hslMatch[4]) : 1;
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      if (s === 0) return [l, l, l, a];
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3), a];
    }
    return [1, 1, 1, 1];
  }
  function parseGradientStops(gradient) {
    let direction = 0;
    const degMatch = gradient.match(/^\s*(-?[\d.]+)deg\s*,\s*/);
    const stopsStr = degMatch ? gradient.slice(degMatch[0].length) : gradient;
    if (degMatch) direction = parseFloat(degMatch[1]);
    const stops = [];
    const re = /((?:rgba?|hsla?)\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+)\s+([\d.]+)%/g;
    let m;
    while ((m = re.exec(stopsStr)) != null) {
      stops.push({ offset: parseFloat(m[2]) / 100, color: m[1] });
    }
    return { direction, stops };
  }
  var TEXT_RENDER_SCALE = 2;
  var Renderer2 = class {
    ogl;
    gl;
    camera;
    scene;
    // 공용 지오메트리 (quad)
    quadGeo;
    // 프로그램 캐시
    colorProgram;
    ellipseProgram;
    textureProgram;
    instancedProgram;
    shadowProgram;
    alphaOutlineProgram;
    alphaShadowProgram;
    // Placeholder 색상 Program (에러 표시)
    placeholderProgram;
    // 공유 메쉬 (매 프레임 객체 생성 방지)
    colorMesh;
    ellipseMesh;
    textureMesh;
    placeholderMesh;
    shadowMesh;
    alphaOutlineMesh;
    alphaShadowMesh;
    // 상태 보존용 렌더 변수 (Model/View 매트릭스 계산용)
    _modelMat = new Mat4();
    _viewMat = new Mat4();
    _tmpVec = new Vec3();
    _activeObj;
    _activeRenderW = 0;
    _activeRenderH = 0;
    // 오브젝트별 Mesh 캐시
    meshCache = /* @__PURE__ */ new Map();
    // 그라디언트 텍스처 캐시 (gradient 키 → Texture)
    _gradientTextureCache = /* @__PURE__ */ new Map();
    // 텍스트 텍스처 캐시 (id → TextTextureEntry)
    textCache = /* @__PURE__ */ new Map();
    // 텍스트 내용 기반 공유 캐시 (contentKey → TextTextureEntry)
    // 동일한 텍스트·스타일을 가진 객체끼리 Canvas/Texture를 공유하여 flush 횟수 감소
    textContentCache = /* @__PURE__ */ new Map();
    // 공유 텍스처 참조 카운트 (contentKey → 참조 중인 객체 수)
    textContentRefCount = /* @__PURE__ */ new Map();
    // 카메라 미지정 시 렌더링할 텍스트 오브젝트 모의 객체
    _noCameraText;
    removeTextEntry(id) {
      const entry = this.textCache.get(id);
      if (!entry) return;
      const contentKey = entry._contentKey;
      if (contentKey) {
        const count = this.textContentRefCount.get(contentKey) || 0;
        if (count <= 1) {
          this.textContentRefCount.delete(contentKey);
          this.textContentCache.delete(contentKey);
          if (entry.texture && entry.texture.delete) {
            ;
            entry.texture.delete();
          }
        } else {
          this.textContentRefCount.set(contentKey, count - 1);
        }
      }
      this.textCache.delete(id);
    }
    // 에셋 텍스처 캐시 (src → Texture)
    assetTextureCache = /* @__PURE__ */ new Map();
    // 비디오 텍스처 캐시 (src → Texture) — 매 프레임 업데이트 필요
    videoTextureCache = /* @__PURE__ */ new Map();
    // --- Auto-Batching State ---
    _batchMaxSize = 1e3;
    _batchMat0;
    _batchMat1;
    _batchMat2;
    _batchMat3;
    _batchOpacityFlip;
    _batchUVParams;
    _batchCount = 0;
    _batchTexture = null;
    _batchBlendMode = "source-over";
    _currentBlendMode = "";
    _instancedGeo;
    _instancedMesh;
    _batchBorderRadius;
    // --- Z-Sort Cache (Dirty-Flag) ---
    /** 정렬 순서가 캐시된 객체 배열 (카메라 거리 기준 내림차순) */
    _sortedObjects = [];
    /** true이면 다음 프레임에 재정렬 */
    _sortDirty = true;
    /** 마지막으로 정렬에 사용된 카메라 회전값 */
    _lastCamRotX = 0;
    _lastCamRotY = 0;
    _lastCamRotZ = 0;
    /** 마지막 정렬 시 객체 수 */
    _lastObjCount = -1;
    _width = 0;
    _height = 0;
    _lastFocalLength = -1;
    constructor(canvas) {
      const N = this._batchMaxSize;
      this._batchMat0 = new Float32Array(N * 4);
      this._batchMat1 = new Float32Array(N * 4);
      this._batchMat2 = new Float32Array(N * 4);
      this._batchMat3 = new Float32Array(N * 4);
      this._batchOpacityFlip = new Float32Array(N * 2);
      this._batchUVParams = new Float32Array(N * 4);
      this._batchBorderRadius = new Float32Array(N * 4);
      this.ogl = new Renderer({
        canvas,
        width: canvas.width,
        height: canvas.height,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false
      });
      this.gl = this.ogl.gl;
      this._width = canvas.width;
      this._height = canvas.height;
      this.camera = new Camera(this.gl, {
        fov: 90,
        aspect: canvas.width / canvas.height,
        near: 0.1,
        far: 1e5
      });
      this.camera.position.z = 0;
      this.scene = new Transform();
      this.quadGeo = createQuadGeometry(this.gl);
      this._initPrograms();
    }
    get width() {
      return this.ogl.width;
    }
    get height() {
      return this.ogl.height;
    }
    /**
     * Z-Sort 캐시를 무효화합니다.
     * 객체의 position.z 또는 zIndex가 변경될 때 World에서 호출합니다.
     */
    markSortDirty() {
      this._sortDirty = true;
    }
    setSize(w, h) {
      this.ogl.setSize(w, h);
      this._width = w;
      this._height = h;
      this._lastFocalLength = -1;
    }
    // ─── 프로그램 초기화 ─────────────────────────────────────────────────────
    _initPrograms() {
      const gl = this.gl;
      this.colorProgram = new Program(gl, {
        vertex: colorVertex,
        fragment: colorFragment,
        uniforms: {
          uColor: { value: [1, 1, 1, 1] },
          uOpacity: { value: 1 },
          uRadius: { value: 0 },
          uBorderRadius: { value: [0, 0, 0, 0] },
          uSize: { value: [1, 1] },
          uIsBorder: { value: 0 },
          uInnerSize: { value: [0, 0] },
          uInnerBorderRadius: { value: [0, 0, 0, 0] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.ellipseProgram = new Program(gl, {
        vertex: ellipseVertex,
        fragment: ellipseFragment,
        uniforms: {
          uColor: { value: [1, 1, 1, 1] },
          uOpacity: { value: 1 },
          uSize: { value: [1, 1] },
          uIsBorder: { value: 0 },
          uInnerSize: { value: [0, 0] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.textureProgram = new Program(gl, {
        vertex: textureVertex,
        fragment: textureFragment,
        uniforms: {
          uTexture: { value: null },
          uOpacity: { value: 1 },
          uFlipY: { value: 0 },
          uUVOffset: { value: [0, 0] },
          uUVScale: { value: [1, 1] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.instancedProgram = new Program(gl, {
        vertex: instancedVertex,
        fragment: instancedFragment,
        uniforms: {
          uTexture: { value: null },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this._instancedGeo = new Geometry(gl, {
        position: { size: 2, data: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]) },
        uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) },
        index: { data: new Uint16Array([0, 1, 2, 0, 2, 3]) },
        instanceMat0: { instanced: 1, size: 4, data: this._batchMat0 },
        instanceMat1: { instanced: 1, size: 4, data: this._batchMat1 },
        instanceMat2: { instanced: 1, size: 4, data: this._batchMat2 },
        instanceMat3: { instanced: 1, size: 4, data: this._batchMat3 },
        instanceOpacityFlip: { instanced: 1, size: 2, data: this._batchOpacityFlip },
        instanceUVParams: { instanced: 1, size: 4, data: this._batchUVParams },
        instanceBorderRadius: { instanced: 1, size: 4, data: this._batchBorderRadius }
      });
      this._instancedMesh = new Mesh(gl, { geometry: this._instancedGeo, program: this.instancedProgram });
      this.placeholderProgram = new Program(gl, {
        vertex: colorVertex,
        fragment: colorFragment,
        uniforms: {
          uColor: { value: [1, 0.2, 0.4, 0.5] },
          uOpacity: { value: 1 },
          uRadius: { value: 0 },
          uSize: { value: [1, 1] },
          uBorderRadius: { value: [0, 0, 0, 0] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.shadowProgram = new Program(gl, {
        vertex: shadowVertex,
        fragment: shadowFragment,
        uniforms: {
          uColor: { value: [0, 0, 0, 0.5] },
          uOpacity: { value: 1 },
          uSize: { value: [1, 1] },
          uBoxSize: { value: [1, 1] },
          uOffset: { value: [0, 0] },
          uBlur: { value: 0 },
          uSpread: { value: 0 },
          uIsEllipse: { value: 0 },
          uBorderRadius: { value: [0, 0, 0, 0] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.alphaOutlineProgram = new Program(gl, {
        vertex: alphaOutlineVertex,
        fragment: alphaOutlineFragment,
        uniforms: {
          uTexture: { value: null },
          uOpacity: { value: 1 },
          uAlphaThreshold: { value: 0.05 },
          uImageOffset: { value: [0, 0] },
          uImageScale: { value: [1, 1] },
          uTexelStep: { value: [0, 0] },
          uBorderWidth: { value: 0 },
          uBorderColor: { value: [1, 0, 0, 1] },
          uOutlineWidth: { value: 0 },
          uOutlineColor: { value: [0, 0, 1, 1] },
          uUVOffset: { value: [0, 0] },
          uUVScale: { value: [1, 1] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.alphaShadowProgram = new Program(gl, {
        vertex: alphaShadowVertex,
        fragment: alphaShadowFragment,
        uniforms: {
          uTexture: { value: null },
          uColor: { value: [0, 0, 0, 0.5] },
          uOpacity: { value: 1 },
          uQuadSize: { value: [1, 1] },
          uImageSize: { value: [1, 1] },
          uOffset: { value: [0, 0] },
          uBlur: { value: 0 },
          uSpread: { value: 0 },
          uAlphaThreshold: { value: 0.05 },
          uUVOffset: { value: [0, 0] },
          uUVScale: { value: [1, 1] },
          uModelMatrix: { value: new Float32Array(16) },
          uViewMatrix: { value: new Float32Array(16) },
          uProjectionMatrix: { value: new Float32Array(16) }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.colorMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.colorProgram });
      this.ellipseMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.ellipseProgram });
      this.textureMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.textureProgram });
      this.placeholderMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.placeholderProgram });
      this.shadowMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.shadowProgram });
      this.alphaOutlineMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.alphaOutlineProgram });
      this.alphaShadowMesh = new Mesh(gl, { geometry: this.quadGeo, program: this.alphaShadowProgram });
    }
    // ─── 공개 렌더 메서드 ────────────────────────────────────────────────────
    render(objects, assets = {}, timestamp = 0, activeCamera = null) {
      if (!activeCamera) {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this._currentBlendMode = "";
        this._setBlendMode("source-over");
        if (!this._noCameraText) {
          this._noCameraText = {
            attribute: { id: "__no_camera_warning__", type: "text", text: '<style fontSize="36" fontWeight="900">No Camera</style>\nAdd Camera and set to world camera' },
            style: { color: "#ff5555", fontSize: 24, textAlign: "center", lineHeight: 1.5, opacity: 1 },
            transform: {
              position: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              pivot: { x: 0.5, y: 0.5 }
            },
            __worldMatrix: new Mat4().translate(new Vec3(0, 0, -100)),
            _fadeOpacity: 1,
            _dirtyTexture: true,
            _textureThrottleCount: 0,
            _textureIdleCount: 0
          };
        }
        this._activeObj = this._noCameraText;
        this._activeRenderW = 200;
        this._activeRenderH = 50;
        const dummyCam = {
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
        };
        this._buildViewMatrix(dummyCam);
        const fov = 2 * Math.atan(this._height / 2 / 100);
        this.camera.perspective({
          fov: fov * 180 / Math.PI,
          aspect: this._width / this._height,
          near: 0.1,
          far: 1e5
        });
        this._drawText(this._noCameraText, 0, 0, 1, timestamp);
        this._flushBatch();
        return;
      }
      const focalLength = activeCamera.attribute.focalLength ?? 100;
      if (this._lastFocalLength !== focalLength) {
        const fov = 2 * Math.atan(this._height / 2 / focalLength);
        this.camera.perspective({
          fov: fov * 180 / Math.PI,
          aspect: this._width / this._height,
          near: 0.1,
          far: 1e5
        });
        this._lastFocalLength = focalLength;
      }
      const camRotX = activeCamera.transform.rotation.x || 0;
      const camRotY = activeCamera.transform.rotation.y || 0;
      const camRotZ = activeCamera.transform.rotation.z || 0;
      const camZ = activeCamera.transform.position.z;
      this._buildViewMatrix(activeCamera);
      const rotChanged = camRotX !== this._lastCamRotX || camRotY !== this._lastCamRotY || camRotZ !== this._lastCamRotZ;
      const countChanged = objects.size !== this._lastObjCount;
      if (this._sortDirty || rotChanged || countChanged) {
        this._lastCamRotX = camRotX;
        this._lastCamRotY = camRotY;
        this._lastCamRotZ = camRotZ;
        this._lastObjCount = objects.size;
        this._sortDirty = false;
        const worldObjects = [];
        const uiObjects = [];
        for (const o of objects) {
          if (o.attribute.type === "camera" || o.style.display === "none") {
            continue;
          }
          let isUI = false;
          if (activeCamera) {
            let curr = o.parent;
            while (curr) {
              if (curr.attribute.id === activeCamera.attribute.id) {
                isUI = true;
                break;
              }
              curr = curr.parent;
            }
          }
          if (isUI) {
            uiObjects.push(o);
          } else {
            worldObjects.push(o);
          }
        }
        const worldSortLogic = (a, b) => {
          const mA = a.__worldMatrix;
          const mB = b.__worldMatrix;
          const zdiff = -mB[14] - -mA[14];
          return zdiff !== 0 ? zdiff : a.style.zIndex - b.style.zIndex;
        };
        const uiSortLogic = (a, b) => {
          const zIndexDiff = a.style.zIndex - b.style.zIndex;
          if (zIndexDiff !== 0) return zIndexDiff;
          const mA = a.__worldMatrix;
          const mB = b.__worldMatrix;
          return -mB[14] - -mA[14];
        };
        worldObjects.sort(worldSortLogic);
        uiObjects.sort(uiSortLogic);
        this._sortedObjects = [...worldObjects, ...uiObjects];
      }
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.enable(this.gl.BLEND);
      this._currentBlendMode = "";
      this._setBlendMode("source-over");
      for (let i = 0, len = this._sortedObjects.length; i < len; i++) {
        const obj = this._sortedObjects[i];
        const mArr = obj.__worldMatrix;
        if (-mArr[14] <= camZ) continue;
        this._drawObject(obj, assets, timestamp);
      }
      this._flushBatch();
    }
    // ─── 내부 오브젝트 렌더 ──────────────────────────────────────────────────
    _drawObject(obj, assets, timestamp) {
      const { style, transform } = obj;
      const baseW = obj.__renderedSize?.w ?? style.width ?? 0;
      const baseH = obj.__renderedSize?.h ?? style.height ?? 0;
      const w = baseW;
      const h = baseH;
      this._activeObj = obj;
      this._activeRenderW = w;
      this._activeRenderH = h;
      const px = 0;
      const py = 0;
      const type = obj.attribute.type;
      switch (type) {
        case "rectangle":
          this._drawRectangle(obj, px, py, w, h);
          break;
        case "ellipse":
          this._drawEllipse(obj, px, py, w, h);
          break;
        case "text":
          this._drawText(obj, px, py, 1, timestamp);
          break;
        case "image":
          this._drawAsset(obj, px, py, w, h, 1, assets);
          break;
        case "video":
          this._drawVideo(obj, px, py, w, h, 1, assets);
          break;
        case "sprite":
          this._drawSprite(obj, px, py, w, h, 1, assets, timestamp);
          break;
        case "particle":
          this._drawParticle(obj, px, py, w, h, 1, assets, timestamp);
          break;
        default:
          break;
      }
    }
    // ─── 모델 행렬 헬퍼 ─────────────────────────────────────────────────────
    /**
     * 객체의 고유 TRS(Translation, Rotation, Scale, Pivot)만으로 Model Matrix를 생성합니다.
     * 카메라 정보는 View Matrix에서 처리됩니다.
     */
    _makeModelMatrix(x, y, w, h, zOffset = 0, baseW, baseH, rotationRad = 0) {
      const obj = this._activeObj;
      const pivot = obj.transform.pivot;
      const pw = baseW ?? w;
      const ph = baseH ?? h;
      this._modelMat.copy(obj.__worldMatrix);
      if (x !== 0 || y !== 0 || zOffset !== 0) {
        this._tmpVec[0] = x;
        this._tmpVec[1] = y;
        this._tmpVec[2] = -zOffset;
        this._modelMat.translate(this._tmpVec);
      }
      this._tmpVec[0] = (0.5 - pivot.x) * pw;
      this._tmpVec[1] = -(0.5 - pivot.y) * ph;
      this._tmpVec[2] = 0;
      this._modelMat.translate(this._tmpVec);
      if (rotationRad !== 0) {
        this._modelMat.rotate(rotationRad, AXIS_Z);
      }
      this._tmpVec[0] = w;
      this._tmpVec[1] = h;
      this._tmpVec[2] = 1;
      this._modelMat.scale(this._tmpVec);
      return this._modelMat;
    }
    /**
     * View Matrix를 직접 계산하여 모든 Program에 업로드합니다.
     * OGL camera.viewMatrix에 의존하지 않고 _viewMat에 직접 구성합니다.
     *
     * 좌표계: obj.z > cam.z = 카메라 앞 (구 시스템과 동일)
     * 모델 z = -obj.z 이므로, 카메라 역변환 z = +camZ
     */
    _buildViewMatrix(cam) {
      const pos = cam.transform.position;
      const rot = cam.transform.rotation;
      this._viewMat.identity();
      if (rot.y) this._viewMat.rotate(-rot.y * Math.PI / 180, AXIS_Y);
      if (rot.x) this._viewMat.rotate(-rot.x * Math.PI / 180, AXIS_X);
      if (rot.z) this._viewMat.rotate(-rot.z * Math.PI / 180, AXIS_Z);
      this._tmpVec[0] = -pos.x;
      this._tmpVec[1] = -pos.y;
      this._tmpVec[2] = pos.z;
      this._viewMat.translate(this._tmpVec);
      const vm = this._viewMat;
      this.colorProgram.uniforms["uViewMatrix"].value = vm;
      this.ellipseProgram.uniforms["uViewMatrix"].value = vm;
      this.textureProgram.uniforms["uViewMatrix"].value = vm;
      this.instancedProgram.uniforms["uViewMatrix"].value = vm;
      this.placeholderProgram.uniforms["uViewMatrix"].value = vm;
      this.shadowProgram.uniforms["uViewMatrix"].value = vm;
      this.alphaOutlineProgram.uniforms["uViewMatrix"].value = vm;
      this.alphaShadowProgram.uniforms["uViewMatrix"].value = vm;
    }
    /** ogl 카메라의 projectionMatrix를 Float32Array로 반환 */
    _projMatrix() {
      return this.camera.projectionMatrix;
    }
    _setBlendMode(mode = "source-over") {
      if (this._currentBlendMode === mode) return;
      this._currentBlendMode = mode;
      const gl = this.gl;
      let eq = gl.FUNC_ADD;
      let src = gl.ONE;
      let dst = gl.ONE_MINUS_SRC_ALPHA;
      let srcA = gl.ONE;
      let dstA = gl.ONE_MINUS_SRC_ALPHA;
      switch (mode) {
        case "source-over":
          src = gl.ONE;
          dst = gl.ONE_MINUS_SRC_ALPHA;
          srcA = gl.ONE;
          dstA = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "source-in":
          src = gl.DST_ALPHA;
          dst = gl.ZERO;
          srcA = gl.DST_ALPHA;
          dstA = gl.ZERO;
          break;
        case "source-out":
          src = gl.ONE_MINUS_DST_ALPHA;
          dst = gl.ZERO;
          srcA = gl.ONE_MINUS_DST_ALPHA;
          dstA = gl.ZERO;
          break;
        case "source-atop":
          src = gl.DST_ALPHA;
          dst = gl.ONE_MINUS_SRC_ALPHA;
          srcA = gl.DST_ALPHA;
          dstA = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "destination-over":
          src = gl.ONE_MINUS_DST_ALPHA;
          dst = gl.ONE;
          srcA = gl.ONE_MINUS_DST_ALPHA;
          dstA = gl.ONE;
          break;
        case "destination-in":
          src = gl.ZERO;
          dst = gl.SRC_ALPHA;
          srcA = gl.ZERO;
          dstA = gl.SRC_ALPHA;
          break;
        case "destination-out":
          src = gl.ZERO;
          dst = gl.ONE_MINUS_SRC_ALPHA;
          srcA = gl.ZERO;
          dstA = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "lighter":
          src = gl.ONE;
          dst = gl.ONE;
          srcA = gl.ONE;
          dstA = gl.ONE;
          break;
        case "copy":
          src = gl.ONE;
          dst = gl.ZERO;
          srcA = gl.ONE;
          dstA = gl.ZERO;
          break;
        case "xor":
          src = gl.ONE_MINUS_DST_ALPHA;
          dst = gl.ONE_MINUS_SRC_ALPHA;
          srcA = gl.ONE_MINUS_DST_ALPHA;
          dstA = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "multiply":
          src = gl.DST_COLOR;
          dst = gl.ONE_MINUS_SRC_ALPHA;
          srcA = gl.DST_COLOR;
          dstA = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "screen":
          src = gl.ONE;
          dst = gl.ONE_MINUS_SRC_COLOR;
          srcA = gl.ONE;
          dstA = gl.ONE_MINUS_SRC_COLOR;
          break;
        case "lighten": {
          const ext = gl.getExtension("EXT_blend_minmax");
          eq = gl.MAX ?? (ext ? ext.MAX_EXT : gl.FUNC_ADD) ?? gl.FUNC_ADD;
          src = gl.ONE;
          dst = gl.ONE;
          srcA = gl.ONE;
          dstA = gl.ONE;
          break;
        }
        case "darken": {
          const ext = gl.getExtension("EXT_blend_minmax");
          eq = gl.MIN ?? (ext ? ext.MIN_EXT : gl.FUNC_ADD) ?? gl.FUNC_ADD;
          src = gl.ONE;
          dst = gl.ONE;
          srcA = gl.ONE;
          dstA = gl.ONE;
          break;
        }
        case "difference":
        case "exclusion":
          src = gl.ONE_MINUS_DST_COLOR;
          dst = gl.ONE_MINUS_SRC_COLOR;
          srcA = gl.ONE_MINUS_DST_COLOR;
          dstA = gl.ONE_MINUS_SRC_COLOR;
          break;
        default:
          break;
      }
      gl.blendEquation(eq);
      gl.blendFuncSeparate(src, dst, srcA, dstA);
    }
    // ─── Program uniform 드로우 헬퍼 ─────────────────────────────────────────
    _flushBatch() {
      if (this._batchCount === 0 || !this._batchTexture) return;
      this.instancedProgram.uniforms["uTexture"].value = this._batchTexture;
      this.instancedProgram.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this._setBlendMode(this._batchBlendMode);
      const gl = this.gl;
      const geo = this._instancedGeo;
      geo.instancedCount = this._batchCount;
      const n = this._batchCount;
      const uploadSubData = (attr, data, stride) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.renderer.state.boundBuffer = attr.buffer;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * stride);
      };
      uploadSubData(geo.attributes.instanceMat0, this._batchMat0, 4);
      uploadSubData(geo.attributes.instanceMat1, this._batchMat1, 4);
      uploadSubData(geo.attributes.instanceMat2, this._batchMat2, 4);
      uploadSubData(geo.attributes.instanceMat3, this._batchMat3, 4);
      uploadSubData(geo.attributes.instanceOpacityFlip, this._batchOpacityFlip, 2);
      uploadSubData(geo.attributes.instanceUVParams, this._batchUVParams, 4);
      uploadSubData(geo.attributes.instanceBorderRadius, this._batchBorderRadius, 4);
      this._instancedMesh.draw({ camera: this.camera });
      this._batchCount = 0;
      this._batchTexture = null;
    }
    _drawColorMesh(program, x, y, w, h, color, opacity, baseW, baseH, borderRadius = null, isBorder = false, innerW, innerH, innerBorderRadius = null) {
      this._flushBatch();
      this._setBlendMode(this._activeObj?.style?.blendMode ?? "source-over");
      const [r, g, b, a] = parseCSSColor(color);
      program.uniforms["uColor"].value = [r, g, b, a];
      program.uniforms["uOpacity"].value = opacity;
      if (program.uniforms["uSize"]) program.uniforms["uSize"].value = [w, h];
      if (program.uniforms["uBorderRadius"] && borderRadius) {
        program.uniforms["uBorderRadius"].value = [borderRadius[1], borderRadius[2], borderRadius[0], borderRadius[3]];
      }
      if (program.uniforms["uIsBorder"]) program.uniforms["uIsBorder"].value = isBorder ? 1 : 0;
      if (program.uniforms["uInnerSize"]) program.uniforms["uInnerSize"].value = [innerW ?? 0, innerH ?? 0];
      if (program.uniforms["uInnerBorderRadius"] && innerBorderRadius) {
        program.uniforms["uInnerBorderRadius"].value = [innerBorderRadius[1], innerBorderRadius[2], innerBorderRadius[0], innerBorderRadius[3]];
      } else if (program.uniforms["uInnerBorderRadius"]) {
        program.uniforms["uInnerBorderRadius"].value = [0, 0, 0, 0];
      }
      program.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, w, h, 0, baseW, baseH);
      program.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this.colorMesh.draw({ camera: this.camera });
    }
    _drawTextureMesh(texture, x, y, w, h, opacity, flipY = false, uvOffset = [0, 0], uvScale = [1, 1], zOffset = 0, borderRadius = null, rotationRad = 0) {
      const blendMode = this._activeObj?.style?.blendMode ?? "source-over";
      if (this._batchTexture !== texture || this._batchBlendMode !== blendMode || this._batchCount >= this._batchMaxSize) {
        this._flushBatch();
      }
      this._batchTexture = texture;
      this._batchBlendMode = blendMode;
      const m = this._makeModelMatrix(x, y, w, h, zOffset, void 0, void 0, rotationRad);
      const idx = this._batchCount;
      const idx4 = idx * 4;
      const idx2 = idx * 2;
      this._batchMat0[idx4] = m[0];
      this._batchMat0[idx4 + 1] = m[1];
      this._batchMat0[idx4 + 2] = m[2];
      this._batchMat0[idx4 + 3] = m[3];
      this._batchMat1[idx4] = m[4];
      this._batchMat1[idx4 + 1] = m[5];
      this._batchMat1[idx4 + 2] = m[6];
      this._batchMat1[idx4 + 3] = m[7];
      this._batchMat2[idx4] = m[8];
      this._batchMat2[idx4 + 1] = m[9];
      this._batchMat2[idx4 + 2] = m[10];
      this._batchMat2[idx4 + 3] = m[11];
      this._batchMat3[idx4] = m[12];
      this._batchMat3[idx4 + 1] = m[13];
      this._batchMat3[idx4 + 2] = m[14];
      this._batchMat3[idx4 + 3] = m[15];
      this._batchOpacityFlip[idx2] = opacity;
      this._batchOpacityFlip[idx2 + 1] = flipY ? 1 : 0;
      this._batchUVParams[idx4] = uvOffset[0];
      this._batchUVParams[idx4 + 1] = uvOffset[1];
      this._batchUVParams[idx4 + 2] = uvScale[0];
      this._batchUVParams[idx4 + 3] = uvScale[1];
      if (borderRadius) {
        this._batchBorderRadius[idx4] = borderRadius[1];
        this._batchBorderRadius[idx4 + 1] = borderRadius[2];
        this._batchBorderRadius[idx4 + 2] = borderRadius[0];
        this._batchBorderRadius[idx4 + 3] = borderRadius[3];
      } else {
        this._batchBorderRadius[idx4] = 0;
        this._batchBorderRadius[idx4 + 1] = 0;
        this._batchBorderRadius[idx4 + 2] = 0;
        this._batchBorderRadius[idx4 + 3] = 0;
      }
      this._batchCount++;
    }
    // ─── Box Shadow ─────────────────────────────────────────────────────────
    _drawShadow(obj, x, y, w, h, baseW, baseH, isEllipse = false, borderRadius = null) {
      const { style } = obj;
      if (!style.boxShadowColor) return;
      const blur = style.boxShadowBlur ?? 0;
      const spread = style.boxShadowSpread ?? 0;
      const offsetX = style.boxShadowOffsetX ?? 0;
      const offsetY = style.boxShadowOffsetY ?? 0;
      const quadW = w + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetX) * 2;
      const quadH = h + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetY) * 2;
      this._flushBatch();
      this._setBlendMode(this._activeObj?.style?.blendMode ?? "source-over");
      const [r, g, b, a] = parseCSSColor(style.boxShadowColor);
      this.shadowProgram.uniforms["uColor"].value = [r, g, b, a];
      this.shadowProgram.uniforms["uOpacity"].value = style.opacity * obj.__fadeOpacity;
      this.shadowProgram.uniforms["uSize"].value = [quadW, quadH];
      this.shadowProgram.uniforms["uBoxSize"].value = [w, h];
      this.shadowProgram.uniforms["uOffset"].value = [offsetX, offsetY];
      if (this.shadowProgram.uniforms["uBorderRadius"] && borderRadius && !isEllipse) {
        this.shadowProgram.uniforms["uBorderRadius"].value = [borderRadius[1], borderRadius[2], borderRadius[0], borderRadius[3]];
      } else if (this.shadowProgram.uniforms["uBorderRadius"]) {
        this.shadowProgram.uniforms["uBorderRadius"].value = [0, 0, 0, 0];
      }
      this.shadowProgram.uniforms["uBlur"].value = blur;
      this.shadowProgram.uniforms["uSpread"].value = spread;
      this.shadowProgram.uniforms["uIsEllipse"].value = isEllipse ? 1 : 0;
      this.shadowProgram.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, quadW, quadH, 0, baseW ?? w, baseH ?? h);
      this.shadowProgram.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this.shadowMesh.draw({ camera: this.camera });
    }
    // ─── Alpha Shadow (image/sprite 전용) ──────────────────────────────────
    /**
     * 이미지 알파채널 경계를 기준으로 그림자를 렌더링합니다.
     * 이미지 불투명 영역 위에서는 그림자가 hidden 처리됩니다.
     */
    _drawAlphaShadow(obj, x, y, drawW, drawH, texture, uvOffset = [0, 0], uvScale = [1, 1]) {
      const { style } = obj;
      if (!style.boxShadowColor) return;
      const blur = style.boxShadowBlur ?? 0;
      const spread = style.boxShadowSpread ?? 0;
      const offsetX = style.boxShadowOffsetX ?? 0;
      const offsetY = style.boxShadowOffsetY ?? 0;
      const quadW = drawW + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetX) * 2;
      const quadH = drawH + (blur * 2 + Math.abs(spread)) * 1.5 + Math.abs(offsetY) * 2;
      this._flushBatch();
      this._setBlendMode(obj.style.blendMode ?? "source-over");
      const [r, g, b, a] = parseCSSColor(style.boxShadowColor);
      const prog = this.alphaShadowProgram;
      prog.uniforms["uTexture"].value = texture;
      prog.uniforms["uColor"].value = [r, g, b, a];
      prog.uniforms["uOpacity"].value = style.opacity * obj.__fadeOpacity;
      prog.uniforms["uQuadSize"].value = [quadW, quadH];
      prog.uniforms["uImageSize"].value = [drawW, drawH];
      prog.uniforms["uOffset"].value = [offsetX, offsetY];
      prog.uniforms["uBlur"].value = blur;
      prog.uniforms["uSpread"].value = spread;
      prog.uniforms["uAlphaThreshold"].value = 0.05;
      prog.uniforms["uUVOffset"].value = uvOffset;
      prog.uniforms["uUVScale"].value = uvScale;
      prog.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, quadW, quadH, 0, drawW, drawH);
      prog.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this.alphaShadowMesh.draw({ camera: this.camera });
    }
    // ─── Alpha Outline (image/sprite 전용) ─────────────────────────────────
    /**
     * 이미지 알파채널 경계를 기준으로 border + outline을 렌더링합니다.
     * 이미지 불투명 픽셀은 discard하여 texture 패스와 중복되지 않습니다.
     */
    _drawAlphaImageBorders(obj, x, y, drawW, drawH, texture, opacity, uvOffset = [0, 0], uvScale = [1, 1]) {
      const { style } = obj;
      const borderWidth = style.borderColor && (style.borderWidth ?? 0) > 0 ? style.borderWidth : 0;
      const outlineWidth = style.outlineColor && (style.outlineWidth ?? 0) > 0 ? style.outlineWidth : 0;
      if (borderWidth <= 0 && outlineWidth <= 0) return;
      const pad = borderWidth + outlineWidth;
      const expandedW = drawW + pad * 2;
      const expandedH = drawH + pad * 2;
      this._flushBatch();
      this._setBlendMode(obj.style.blendMode ?? "source-over");
      const prog = this.alphaOutlineProgram;
      prog.uniforms["uTexture"].value = texture;
      prog.uniforms["uOpacity"].value = opacity;
      prog.uniforms["uAlphaThreshold"].value = 0.05;
      prog.uniforms["uImageOffset"].value = [pad / expandedW, pad / expandedH];
      prog.uniforms["uImageScale"].value = [drawW / expandedW, drawH / expandedH];
      prog.uniforms["uTexelStep"].value = [1 / drawW, 1 / drawH];
      prog.uniforms["uBorderWidth"].value = borderWidth;
      prog.uniforms["uBorderColor"].value = parseCSSColor(style.borderColor ?? "transparent");
      prog.uniforms["uOutlineWidth"].value = outlineWidth;
      prog.uniforms["uOutlineColor"].value = parseCSSColor(style.outlineColor ?? "transparent");
      prog.uniforms["uUVOffset"].value = uvOffset;
      prog.uniforms["uUVScale"].value = uvScale;
      prog.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, expandedW, expandedH, 0, drawW, drawH);
      prog.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this.alphaOutlineMesh.draw({ camera: this.camera });
    }
    _drawRectBorders(obj, x, y, w, h, targetOpacity) {
      const { style } = obj;
      if (style.outlineColor && (style.outlineWidth ?? 0) > 0) {
        const bw = style.borderWidth ?? 0;
        const ow = style.outlineWidth;
        const outerW = w + bw * 2 + ow * 2;
        const outerH = h + bw * 2 + ow * 2;
        const innerW = w + bw * 2;
        const innerH = h + bw * 2;
        const rOut = parseBorderRadius(style.borderRadius, w, h, bw + ow);
        const rIn = parseBorderRadius(style.borderRadius, w, h, bw);
        this._drawColorMesh(this.colorProgram, x, y, outerW, outerH, style.outlineColor, targetOpacity, w, h, rOut, true, innerW, innerH, rIn);
      }
      if (style.borderColor && (style.borderWidth ?? 0) > 0) {
        const bw = style.borderWidth;
        const outerW = w + bw * 2;
        const outerH = h + bw * 2;
        const rBorder = parseBorderRadius(style.borderRadius, w, h, bw);
        const rInner = parseBorderRadius(style.borderRadius, w, h, 0);
        this._drawColorMesh(this.colorProgram, x, y, outerW, outerH, style.borderColor, targetOpacity, w, h, rBorder, true, w, h, rInner);
      }
    }
    // ─── Rectangle ──────────────────────────────────────────────────────────
    _drawRectangle(obj, x, y, w, h) {
      const { style } = obj;
      if (!style.color && !style.gradient && !style.borderColor && !style.outlineColor) return;
      const targetOpacity = style.opacity * obj.__fadeOpacity;
      const baseRadius = parseBorderRadius(style.borderRadius, w, h, 0);
      this._drawShadow(obj, x, y, w, h, void 0, void 0, false, baseRadius);
      this._drawRectBorders(obj, x, y, w, h, targetOpacity);
      if (style.color) {
        this._drawColorMesh(this.colorProgram, x, y, w, h, style.color, targetOpacity, w, h, baseRadius);
      }
      if (style.gradient && w > 0 && h > 0) {
        const tex = this._makeGradientTexture(w, h, style.gradient, style.gradientType ?? "linear", false, baseRadius);
        if (tex) this._drawTextureMesh(tex, x, y, w, h, targetOpacity);
      }
    }
    // ─── Ellipse ────────────────────────────────────────────────────────────
    _drawEllipse(obj, x, y, w, h) {
      this._flushBatch();
      this._setBlendMode(this._activeObj?.style?.blendMode ?? "source-over");
      const { style } = obj;
      if (!style.color && !style.gradient && !style.borderColor && !style.outlineColor) return;
      this._drawShadow(obj, x, y, w, h, void 0, void 0, true);
      const drawEllipse = (ew, eh, color, isBorder = false, innerEW = 0, innerEH = 0) => {
        const [r, g, b, a] = parseCSSColor(color);
        this.ellipseProgram.uniforms["uColor"].value = [r, g, b, a];
        this.ellipseProgram.uniforms["uOpacity"].value = style.opacity * obj.__fadeOpacity;
        if (this.ellipseProgram.uniforms["uSize"]) this.ellipseProgram.uniforms["uSize"].value = [ew, eh];
        if (this.ellipseProgram.uniforms["uIsBorder"]) this.ellipseProgram.uniforms["uIsBorder"].value = isBorder ? 1 : 0;
        if (this.ellipseProgram.uniforms["uInnerSize"]) this.ellipseProgram.uniforms["uInnerSize"].value = [innerEW, innerEH];
        this.ellipseProgram.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, ew, eh, 0, w, h);
        this.ellipseProgram.uniforms["uProjectionMatrix"].value = this._projMatrix();
        this.ellipseMesh.draw({ camera: this.camera });
      };
      if (style.outlineColor && (style.outlineWidth ?? 0) > 0) {
        const bw = style.borderWidth ?? 0;
        const ow = style.outlineWidth;
        const outerW = w + bw * 2 + ow * 2;
        const outerH = h + bw * 2 + ow * 2;
        const innerW = w + bw * 2;
        const innerH = h + bw * 2;
        drawEllipse(outerW, outerH, style.outlineColor, true, innerW, innerH);
      }
      if (style.borderColor && (style.borderWidth ?? 0) > 0) {
        const bw = style.borderWidth;
        const outerW = w + bw * 2;
        const outerH = h + bw * 2;
        drawEllipse(outerW, outerH, style.borderColor, true, w, h);
      }
      if (style.color) {
        drawEllipse(w, h, style.color, false);
      }
      if (style.gradient && w > 0 && h > 0) {
        const tex = this._makeGradientTexture(w, h, style.gradient, style.gradientType ?? "linear", true);
        if (tex) this._drawTextureMesh(tex, x, y, w, h, style.opacity * obj.__fadeOpacity);
      }
    }
    // ─── Text (Offscreen Canvas → Texture) ──────────────────────────────────
    _drawText(obj, x, y, perspectiveScale, _timestamp) {
      const { style, attribute } = obj;
      const id = obj.attribute.id;
      const rawText = attribute.text ?? "";
      const baseFontSize = style.fontSize ?? 16;
      const maxW = style.width != null ? style.width * TEXT_RENDER_SCALE : null;
      const maxH = style.height != null ? style.height * TEXT_RENDER_SCALE : null;
      const contentKey = `${rawText}|${baseFontSize}|${style.fontFamily ?? ""}|${style.fontWeight ?? ""}|${style.fontStyle ?? ""}|${style.color ?? ""}|${style.borderColor ?? ""}|${style.borderWidth ?? 0}|${style.textAlign ?? ""}|${style.lineHeight ?? 1}|${style.letterSpacing ?? 0}|${maxW ?? ""}|${maxH ?? ""}|${style.textShadowColor ?? ""}|${style.textShadowBlur ?? 0}|${style.textShadowOffsetX ?? 0}|${style.textShadowOffsetY ?? 0}`;
      let entry = this.textCache.get(id);
      obj.__textureThrottleCount++;
      if (obj.__dirtyTexture) obj.__textureIdleCount++;
      const needRender = !entry || obj.__dirtyTexture && (obj.__textureIdleCount >= TEXTURE_DEBOUNCE_FRAMES || obj.__textureThrottleCount >= TEXTURE_THROTTLE_FRAMES);
      if (!entry) {
        const shared = this.textContentCache.get(contentKey);
        if (shared) {
          entry = shared;
          this.textCache.set(id, entry);
          const refCount = this.textContentRefCount.get(contentKey) || 0;
          this.textContentRefCount.set(contentKey, refCount + 1);
          obj.__dirtyTexture = false;
          obj.__textureIdleCount = 0;
          obj.__textureThrottleCount = 0;
        } else {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const texture = new Texture(this.gl, { image: canvas, generateMipmaps: false });
          const mesh = new Mesh(this.gl, { geometry: this.quadGeo, program: this.textureProgram });
          entry = { texture, canvas, ctx, lastText: "", mesh };
          entry._contentKey = contentKey;
          this.textCache.set(id, entry);
          this.textContentCache.set(contentKey, entry);
          this.textContentRefCount.set(contentKey, 1);
        }
      }
      if (needRender) {
        const prevContentKey = entry._contentKey;
        if (prevContentKey && prevContentKey !== contentKey) {
          const prevCount = this.textContentRefCount.get(prevContentKey) || 0;
          if (prevCount <= 1) {
            this.textContentRefCount.delete(prevContentKey);
            this.textContentCache.delete(prevContentKey);
            if (entry.texture && entry.texture.delete) {
              ;
              entry.texture.delete();
            }
          } else {
            this.textContentRefCount.set(prevContentKey, prevCount - 1);
          }
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const texture = new Texture(this.gl, { image: canvas, generateMipmaps: false });
          const mesh = new Mesh(this.gl, { geometry: this.quadGeo, program: this.textureProgram });
          entry = { texture, canvas, ctx, lastText: "", mesh };
          this.textCache.set(id, entry);
        }
        ;
        entry._contentKey = contentKey;
        this._renderTextToCanvas(entry, rawText, style, baseFontSize, maxW, maxH, obj.__transitionProgress ?? 1);
        this.textContentCache.set(contentKey, entry);
        if (prevContentKey !== contentKey) {
          const refCount = this.textContentRefCount.get(contentKey) || 0;
          this.textContentRefCount.set(contentKey, refCount + 1);
        }
        obj.__dirtyTexture = false;
        obj.__textureIdleCount = 0;
        obj.__textureThrottleCount = 0;
      }
      const cw = entry.canvas.width;
      const ch = entry.canvas.height;
      if (cw === 0 || ch === 0) return;
      obj.__renderedSize = {
        w: cw / TEXT_RENDER_SCALE,
        h: ch / TEXT_RENDER_SCALE
      };
      const displayScale = perspectiveScale / TEXT_RENDER_SCALE;
      this._drawShadow(obj, x, y, cw * displayScale, ch * displayScale);
      this._drawTextureMesh(entry.texture, x, y, cw * displayScale, ch * displayScale, style.opacity * obj.__fadeOpacity, false);
    }
    _renderTextToCanvas(entry, rawText, style, baseFontSize, maxW, maxH, transitionProgress = 1) {
      const { canvas, ctx } = entry;
      const fontFamily = style.fontFamily ?? "sans-serif";
      const baseFontWeight = style.fontWeight ?? "normal";
      const baseFontStyle = style.fontStyle ?? "normal";
      const baseColor = style.color ?? "#000000";
      const lineHeightMul = style.lineHeight ?? 1;
      const textAlign = style.textAlign ?? "left";
      const spans = parseTextMarkup(rawText, {
        fontSize: baseFontSize,
        fontWeight: baseFontWeight,
        fontStyle: baseFontStyle,
        color: baseColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        textShadowColor: style.textShadowColor,
        textShadowBlur: style.textShadowBlur,
        textShadowOffsetX: style.textShadowOffsetX,
        textShadowOffsetY: style.textShadowOffsetY
      });
      const shadowColor = style.textShadowColor;
      const shadowBlur = (style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE;
      const shadowOffsetX = (style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE;
      const shadowOffsetY = (style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE;
      const spaceRe = /(\S+|\s+)/g;
      const renderLines = [];
      const logicalLines = [[]];
      for (const span of spans) {
        const parts = span.text.split("\n");
        parts.forEach((p, i) => {
          if (i > 0) logicalLines.push([]);
          if (p) logicalLines[logicalLines.length - 1].push({ text: p, span });
        });
      }
      canvas.width = 2;
      canvas.height = 2;
      for (const logLine of logicalLines) {
        let curLine = [];
        let curW = 0;
        let curH = baseFontSize * TEXT_RENDER_SCALE * lineHeightMul;
        const flushLine = () => {
          if (curLine.length > 0 || renderLines.length === 0) {
            renderLines.push({ tokens: curLine, lineH: curH });
          }
          curLine = [];
          curW = 0;
          curH = baseFontSize * TEXT_RENDER_SCALE * lineHeightMul;
        };
        if (logLine.length === 0) {
          renderLines.push({ tokens: [], lineH: baseFontSize * TEXT_RENDER_SCALE * lineHeightMul });
          continue;
        }
        for (const token of logLine) {
          const fs = (token.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE;
          const fw = token.span.style.fontWeight ?? baseFontWeight;
          const fi = token.span.style.fontStyle ?? baseFontStyle;
          const ls = (token.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE;
          const lh = token.span.style.lineHeight ?? lineHeightMul;
          curH = Math.max(curH, fs * lh);
          ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`;
          ctx.letterSpacing = `${ls}px`;
          if (maxW === null) {
            curLine.push(token);
          } else {
            const words = token.text.match(spaceRe) ?? [token.text];
            for (const word of words) {
              const wordW = ctx.measureText(word).width;
              if (curW > 0 && curW + wordW > maxW) flushLine();
              curLine.push({ text: word, span: token.span });
              curW += wordW;
            }
          }
        }
        flushLine();
      }
      const measuredWidths = renderLines.map((rl) => {
        let w = 0;
        for (const tok of rl.tokens) {
          const fs = (tok.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE;
          const fw = tok.span.style.fontWeight ?? baseFontWeight;
          const fi = tok.span.style.fontStyle ?? baseFontStyle;
          const ls = (tok.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE;
          ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`;
          ctx.letterSpacing = `${ls}px`;
          w += ctx.measureText(tok.text).width;
        }
        return w;
      });
      const containerW = maxW ?? Math.max(...measuredWidths, 0);
      const totalH = renderLines.reduce((s, r) => s + r.lineH, 0);
      let maxBorderWidth = 0;
      let maxShadowBlur = shadowBlur;
      let maxShadowOffsetX = Math.abs(shadowOffsetX);
      let maxShadowOffsetY = Math.abs(shadowOffsetY);
      for (const span of spans) {
        if (span.style.borderColor) {
          maxBorderWidth = Math.max(maxBorderWidth, (span.style.borderWidth ?? 1) * TEXT_RENDER_SCALE);
        }
        if (span.style.textShadowColor) {
          maxShadowBlur = Math.max(maxShadowBlur, (span.style.textShadowBlur ?? style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE);
          maxShadowOffsetX = Math.max(maxShadowOffsetX, Math.abs((span.style.textShadowOffsetX ?? style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE));
          maxShadowOffsetY = Math.max(maxShadowOffsetY, Math.abs((span.style.textShadowOffsetY ?? style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE));
        }
      }
      const canvasW = Math.ceil(maxW ?? containerW) + maxShadowBlur * 2 + maxShadowOffsetX + maxBorderWidth * 2;
      const canvasH = Math.ceil(maxH ?? totalH) + maxShadowBlur * 2 + maxShadowOffsetY + maxBorderWidth * 2;
      canvas.width = canvasW;
      canvas.height = canvasH;
      ctx.clearRect(0, 0, canvasW, canvasH);
      const originX = maxShadowBlur + Math.max(0, style.textShadowOffsetX ? maxShadowOffsetX / 2 : 0) + maxBorderWidth;
      const originY = maxShadowBlur + Math.max(0, style.textShadowOffsetY ? maxShadowOffsetY / 2 : 0) + maxBorderWidth;
      let curY = originY;
      for (let li = 0; li < renderLines.length; li++) {
        const rl = renderLines[li];
        const lineW = measuredWidths[li];
        let lineStartX;
        if (textAlign === "center") lineStartX = originX + (containerW - lineW) / 2;
        else if (textAlign === "right") lineStartX = originX + containerW - lineW;
        else lineStartX = originX;
        let penX = lineStartX;
        const baseline = curY + rl.lineH * 0.8;
        for (const tok of rl.tokens) {
          const fs = (tok.span.style.fontSize ?? baseFontSize) * TEXT_RENDER_SCALE;
          const fw = tok.span.style.fontWeight ?? baseFontWeight;
          const fi = tok.span.style.fontStyle ?? baseFontStyle;
          const fc = tok.span.style.color ?? baseColor;
          const bc = tok.span.style.borderColor;
          const bw = (tok.span.style.borderWidth ?? 1) * TEXT_RENDER_SCALE;
          const ls = (tok.span.style.letterSpacing ?? style.letterSpacing ?? 0) * TEXT_RENDER_SCALE;
          const tsc = tok.span.style.textShadowColor ?? shadowColor;
          const tsb = (tok.span.style.textShadowBlur ?? style.textShadowBlur ?? 0) * TEXT_RENDER_SCALE;
          const tsx = (tok.span.style.textShadowOffsetX ?? style.textShadowOffsetX ?? 0) * TEXT_RENDER_SCALE;
          const tsy = (tok.span.style.textShadowOffsetY ?? style.textShadowOffsetY ?? 0) * TEXT_RENDER_SCALE;
          ctx.font = `${fi} ${fw} ${fs}px ${fontFamily}`;
          ctx.letterSpacing = `${ls}px`;
          if (tsc) {
            ctx.shadowColor = tsc;
            ctx.shadowBlur = tsb;
            ctx.shadowOffsetX = tsx;
            ctx.shadowOffsetY = tsy;
          } else {
            ctx.shadowColor = "transparent";
          }
          if (bc) {
            ctx.lineJoin = "round";
            ctx.miterLimit = 2;
            ctx.strokeStyle = bc;
            ctx.lineWidth = bw * 2;
            ctx.strokeText(tok.text, penX, baseline);
          }
          ctx.fillStyle = fc;
          ctx.fillText(tok.text, penX, baseline);
          penX += ctx.measureText(tok.text).width;
        }
        curY += rl.lineH;
      }
      if (transitionProgress < 1) {
        ctx.globalCompositeOperation = "destination-out";
        const totalLines = renderLines.length;
        let lineTopY = 0;
        for (let li = 0; li < renderLines.length; li++) {
          const rl = renderLines[li];
          const lineBottomY = li === totalLines - 1 ? canvasH : lineTopY + rl.lineH;
          const lineProgress = Math.min(1, Math.max(0, transitionProgress * totalLines - li));
          if (lineProgress === 0) {
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(0, lineTopY, canvasW, lineBottomY - lineTopY);
          } else if (lineProgress < 1) {
            const gradLineW = canvasW * 0.3;
            const revealX = (canvasW + gradLineW) * lineProgress - gradLineW;
            const grad = ctx.createLinearGradient(revealX, 0, revealX + gradLineW, 0);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,1)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, lineTopY, canvasW, lineBottomY - lineTopY);
          }
          lineTopY += rl.lineH;
        }
        ctx.globalCompositeOperation = "source-over";
      }
      entry.texture.image = canvas;
      entry.texture.needsUpdate = true;
    }
    // ─── Image ──────────────────────────────────────────────────────────────
    _drawAsset(obj, x, y, w, h, perspectiveScale, assets) {
      const src = obj.attribute?.src;
      const oldSrc = obj.__transitionOldSrc;
      const progress = obj.__transitionProgress ?? 0;
      const drawAssetInner = (assetSrc, drawOpacity) => {
        const asset = assets[assetSrc];
        if (!asset || !(asset instanceof HTMLImageElement)) {
          if (!oldSrc || assetSrc === src) {
            this._drawPlaceholder(x, y, w || 60, h || 60);
          }
          return;
        }
        let drawW, drawH;
        if (w && !h) {
          drawW = w;
          drawH = w * (asset.naturalHeight / asset.naturalWidth);
        } else if (!w && h) {
          drawW = h * (asset.naturalWidth / asset.naturalHeight);
          drawH = h;
        } else {
          drawW = w || asset.naturalWidth * perspectiveScale;
          drawH = h || asset.naturalHeight * perspectiveScale;
        }
        obj.__renderedSize = {
          w: drawW / perspectiveScale,
          h: drawH / perspectiveScale
        };
        const baseRadius = parseBorderRadius(obj.style.borderRadius, drawW, drawH, 0);
        const texture = this._getOrCreateAssetTexture(assetSrc, asset);
        this._drawAlphaShadow(obj, x, y, drawW, drawH, texture);
        this._drawAlphaImageBorders(obj, x, y, drawW, drawH, texture, obj.style.opacity * obj.__fadeOpacity);
        this._drawTextureMesh(texture, x, y, drawW, drawH, drawOpacity, false, [0, 0], [1, 1], 0, baseRadius);
      };
      if (oldSrc) {
        drawAssetInner(oldSrc, obj.style.opacity * obj.__fadeOpacity * (1 - progress));
        if (src) {
          drawAssetInner(src, obj.style.opacity * obj.__fadeOpacity * progress);
        }
      } else if (src) {
        drawAssetInner(src, obj.style.opacity * obj.__fadeOpacity);
      } else {
        this._drawPlaceholder(x, y, w || 60, h || 60);
      }
    }
    // ─── Video ──────────────────────────────────────────────────────────────
    _drawVideo(obj, x, y, w, h, perspectiveScale, assets) {
      const src = obj.__src;
      const asset = src ? assets[src] : void 0;
      if (!asset || !(asset instanceof HTMLVideoElement)) {
        this._drawPlaceholder(x, y, w || 60, h || 60);
        return;
      }
      obj.__videoElement = asset;
      const clip = obj.__clip;
      if (obj.__playing) {
        if (clip) {
          asset.loop = clip.loop;
          if (obj.__needsSeekToStart && clip.start != null) {
            asset.currentTime = clip.start / 1e3;
            obj.__needsSeekToStart = false;
          }
        }
        if (asset.paused) asset.play().catch(() => {
        });
      } else {
        if (!asset.paused) asset.pause();
      }
      if (obj.__pendingSeek != null) {
        asset.currentTime = obj.__pendingSeek;
        obj.__pendingSeek = null;
      }
      if (clip && clip.end != null && asset.currentTime >= clip.end / 1e3) {
        if (clip.loop) {
          asset.currentTime = (clip.start ?? 0) / 1e3;
          obj.__onRepeat();
        } else {
          asset.pause();
          obj.__onEnded();
        }
      }
      let drawW, drawH;
      if (w && !h) {
        drawW = w;
        drawH = w * (asset.videoHeight / asset.videoWidth);
      } else if (!w && h) {
        drawW = h * (asset.videoWidth / asset.videoHeight);
        drawH = h;
      } else {
        drawW = w || asset.videoWidth * perspectiveScale;
        drawH = h || asset.videoHeight * perspectiveScale;
      }
      obj.__renderedSize = {
        w: drawW / perspectiveScale,
        h: drawH / perspectiveScale
      };
      const baseRadius = parseBorderRadius(obj.style.borderRadius, drawW, drawH, 0);
      this._drawShadow(obj, x, y, drawW, drawH, drawW, drawH, false, baseRadius);
      this._drawRectBorders(obj, x, y, drawW, drawH, obj.style.opacity * obj.__fadeOpacity);
      let tex = this.videoTextureCache.get(src);
      if (!tex) {
        tex = new Texture(this.gl, { image: asset, generateMipmaps: false });
        this.videoTextureCache.set(src, tex);
      }
      tex.image = asset;
      tex.needsUpdate = true;
      this._drawTextureMesh(tex, x, y, drawW, drawH, obj.style.opacity * obj.__fadeOpacity, false, [0, 0], [1, 1], 0, baseRadius);
    }
    // ─── Sprite ─────────────────────────────────────────────────────────────
    _drawSprite(sprite, x, y, w, h, perspectiveScale, assets, timestamp) {
      sprite.__tick(timestamp);
      const clip = sprite.__clip;
      const src = clip?.src;
      if (!src) return;
      const asset = assets[src];
      if (!asset || !(asset instanceof HTMLImageElement)) {
        this._drawPlaceholder(x, y, w || 60, h || 60);
        return;
      }
      const texture = this._getOrCreateAssetTexture(src, asset);
      if (!clip) {
        let drawW2, drawH2;
        if (w && !h) {
          drawW2 = w;
          drawH2 = w * (asset.naturalHeight / asset.naturalWidth);
        } else if (!w && h) {
          drawW2 = h * (asset.naturalWidth / asset.naturalHeight);
          drawH2 = h;
        } else {
          drawW2 = w || asset.naturalWidth * perspectiveScale;
          drawH2 = h || asset.naturalHeight * perspectiveScale;
        }
        sprite.__renderedSize = {
          w: drawW2 / perspectiveScale,
          h: drawH2 / perspectiveScale
        };
        const baseRadius2 = parseBorderRadius(sprite.style.borderRadius, drawW2, drawH2, 0);
        this._drawAlphaShadow(sprite, x, y, drawW2, drawH2, texture);
        this._drawAlphaImageBorders(sprite, x, y, drawW2, drawH2, texture, (sprite.style.opacity ?? 1) * sprite.__fadeOpacity);
        this._drawTextureMesh(texture, x, y, drawW2, drawH2, (sprite.style.opacity ?? 1) * sprite.__fadeOpacity, false, [0, 0], [1, 1], 0, baseRadius2);
        return;
      }
      const { frameWidth, frameHeight } = clip;
      const sheetCols = Math.floor(asset.naturalWidth / frameWidth);
      const frameIdx = sprite.__currentFrame;
      const col = frameIdx % sheetCols;
      const row = Math.floor(frameIdx / sheetCols);
      const uvScaleX = frameWidth / asset.naturalWidth;
      const uvScaleY = frameHeight / asset.naturalHeight;
      const uvOffsetX = col * uvScaleX;
      const uvOffsetY = 1 - (row + 1) * uvScaleY;
      let drawW, drawH;
      if (w && !h) {
        drawW = w;
        drawH = w * (frameHeight / frameWidth);
      } else if (!w && h) {
        drawW = h * (frameWidth / frameHeight);
        drawH = h;
      } else {
        drawW = w || frameWidth * perspectiveScale;
        drawH = h || frameHeight * perspectiveScale;
      }
      sprite.__renderedSize = {
        w: drawW / perspectiveScale,
        h: drawH / perspectiveScale
      };
      const baseRadius = parseBorderRadius(sprite.style.borderRadius, drawW, drawH, 0);
      this._drawAlphaShadow(sprite, x, y, drawW, drawH, texture, [uvOffsetX, uvOffsetY], [uvScaleX, uvScaleY]);
      this._drawAlphaImageBorders(sprite, x, y, drawW, drawH, texture, (sprite.style.opacity ?? 1) * sprite.__fadeOpacity, [uvOffsetX, uvOffsetY], [uvScaleX, uvScaleY]);
      this._drawTextureMesh(
        texture,
        x,
        y,
        drawW,
        drawH,
        (sprite.style.opacity ?? 1) * sprite.__fadeOpacity,
        false,
        [uvOffsetX, uvOffsetY],
        [uvScaleX, uvScaleY],
        0,
        baseRadius
      );
    }
    // ─── Particle (Instanced) ────────────────────────────────────────────────
    _drawParticle(obj, emX, emY, w, h, perspectiveScale, assets, timestamp) {
      obj.__tick(timestamp);
      const clip = obj.__clip;
      if (!clip) return;
      const asset = assets[clip.src];
      if (!asset || !(asset instanceof HTMLImageElement)) {
        this._drawPlaceholder(emX, emY, w || 30, h || 30);
        return;
      }
      const instances = obj.__instances;
      if (instances.length === 0) return;
      const natW = asset.naturalWidth;
      const natH = asset.naturalHeight;
      let baseW, baseH;
      if (w && !h) {
        baseW = w;
        baseH = w * (natH / natW);
      } else if (!w && h) {
        baseW = h * (natW / natH);
        baseH = h;
      } else {
        baseW = w || natW;
        baseH = h || natH;
      }
      const texture = this._getOrCreateAssetTexture(clip.src, asset);
      for (const inst of instances) {
        const age = timestamp - inst.born;
        const t = Math.min(age / inst.lifespan, 1);
        let scale5 = 1;
        if (inst.sizes.length > 0) {
          if (inst.sizes.length === 1) {
            scale5 = inst.sizes[0];
          } else {
            const segments = inst.sizes.length - 1;
            const segmentIndex = Math.min(Math.floor(t * segments), segments - 1);
            const maxSegT = 1 / segments;
            const localT = (t - segmentIndex * maxSegT) / maxSegT;
            scale5 = inst.sizes[segmentIndex] + (inst.sizes[segmentIndex + 1] - inst.sizes[segmentIndex]) * localT;
          }
        }
        let opacity = 1;
        if (inst.opacities.length > 0) {
          if (inst.opacities.length === 1) {
            opacity = inst.opacities[0];
          } else {
            const segments = inst.opacities.length - 1;
            const segmentIndex = Math.min(Math.floor(t * segments), segments - 1);
            const maxSegT = 1 / segments;
            const localT = (t - segmentIndex * maxSegT) / maxSegT;
            opacity = inst.opacities[segmentIndex] + (inst.opacities[segmentIndex + 1] - inst.opacities[segmentIndex]) * localT;
          }
        }
        if (opacity <= 0 || scale5 <= 0) continue;
        const ix = emX + inst.x * perspectiveScale;
        const iy = emY + inst.y * perspectiveScale;
        const iw = baseW * scale5;
        const ih = baseH * scale5;
        this._drawTextureMesh(
          texture,
          ix,
          iy,
          iw,
          ih,
          (obj.style.opacity ?? 1) * obj.__fadeOpacity * opacity,
          false,
          [0, 0],
          [1, 1],
          inst.z || 0,
          null,
          inst.angle || 0
        );
      }
    }
    // ─── Gradient Texture ────────────────────────────────────────────────────
    /**
     * gradient stops 문자열로부터 Offscreen Canvas 텍스처를 생성합니다.
     * @param ellipseClip true이면 ellipse SDF 원형 클리핑을 Canvas 내에서 적용합니다.
     */
    _makeGradientTexture(w, h, gradient, type, ellipseClip, borderRadius = null) {
      const radiusKey = borderRadius ? borderRadius.join(",") : "";
      const cacheKey = `${Math.round(w)}|${Math.round(h)}|${gradient}|${type}|${ellipseClip}|${radiusKey}`;
      let tex = this._gradientTextureCache.get(cacheKey);
      if (tex) return tex;
      const { direction, stops } = parseGradientStops(gradient);
      if (stops.length === 0) return null;
      const pw = Math.max(1, Math.round(w));
      const ph = Math.max(1, Math.round(h));
      const canvas = document.createElement("canvas");
      canvas.width = pw;
      canvas.height = ph;
      const ctx = canvas.getContext("2d");
      if (ellipseClip) {
        ctx.beginPath();
        ctx.ellipse(pw / 2, ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
        ctx.clip();
      } else if (borderRadius && borderRadius.some((r) => r > 0)) {
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ;
          ctx.roundRect(0, 0, pw, ph, borderRadius);
        } else {
          const [tl, tr, br, bl] = borderRadius;
          ctx.moveTo(tl, 0);
          ctx.lineTo(pw - tr, 0);
          ctx.quadraticCurveTo(pw, 0, pw, tr);
          ctx.lineTo(pw, ph - br);
          ctx.quadraticCurveTo(pw, ph, pw - br, ph);
          ctx.lineTo(bl, ph);
          ctx.quadraticCurveTo(0, ph, 0, ph - bl);
          ctx.lineTo(0, tl);
          ctx.quadraticCurveTo(0, 0, tl, 0);
        }
        ctx.clip();
      }
      if (type === "circular") {
        ctx.save();
        const cx = pw / 2;
        const cy = ph / 2;
        ctx.translate(cx, cy);
        ctx.scale(pw / 2, ph / 2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        for (const stop of stops) {
          grad.addColorStop(stop.offset, stop.color);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      } else {
        const rad = (direction - 90) * Math.PI / 180;
        const cx = pw / 2;
        const cy = ph / 2;
        const halfLen = (Math.abs(pw * Math.cos(rad)) + Math.abs(ph * Math.sin(rad))) / 2;
        const x0 = cx - Math.cos(rad) * halfLen;
        const y0 = cy - Math.sin(rad) * halfLen;
        const x1 = cx + Math.cos(rad) * halfLen;
        const y1 = cy + Math.sin(rad) * halfLen;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        for (const stop of stops) {
          grad.addColorStop(stop.offset, stop.color);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, pw, ph);
      }
      tex = new Texture(this.gl, { image: canvas, generateMipmaps: false });
      this._gradientTextureCache.set(cacheKey, tex);
      return tex;
    }
    // ─── Placeholder ────────────────────────────────────────────────────────
    _drawPlaceholder(x, y, w, h) {
      this._flushBatch();
      this._setBlendMode(this._activeObj?.style?.blendMode ?? "source-over");
      this.placeholderProgram.uniforms["uModelMatrix"].value = this._makeModelMatrix(x, y, w, h);
      this.placeholderProgram.uniforms["uProjectionMatrix"].value = this._projMatrix();
      this.placeholderMesh.draw({ camera: this.camera });
    }
    // ─── Texture 캐시 ────────────────────────────────────────────────────────
    _getOrCreateAssetTexture(src, asset) {
      let tex = this.assetTextureCache.get(src);
      if (!tex) {
        tex = new Texture(this.gl, { image: asset, generateMipmaps: false });
        this.assetTextureCache.set(src, tex);
      }
      return tex;
    }
  };
  var AXIS_X2 = new Vec3(1, 0, 0);
  var AXIS_Y2 = new Vec3(0, 1, 0);
  var AXIS_Z2 = new Vec3(0, 0, 1);
  function wrapMouseEvent(e) {
    const wrapped = e;
    if (wrapped._propagationStopped !== void 0) return wrapped;
    wrapped._propagationStopped = false;
    const original = e.stopPropagation.bind(e);
    e.stopPropagation = () => {
      wrapped._propagationStopped = true;
      original();
    };
    return wrapped;
  }
  var World = class extends EventEmitter {
    renderer;
    objects = /* @__PURE__ */ new Set();
    rafId = null;
    physics = new PhysicsEngine();
    _canvas = null;
    /** 현재 포커스 중인 카메라 (지정되지 않으면 객체 중 Camera를 찾습니다) */
    _activeCamera = null;
    /** 물리 엔진의 중력 프로퍼티 프록시 */
    _gravityProxy;
    /** mouseover 상태 추적 (객체 id → boolean) */
    _mouseOver = /* @__PURE__ */ new Set();
    /** 브라우저 기본 컨텍스트 메뉴 비활성화 여부 */
    disableContextMenu;
    /** 스프라이트 애니메이션 클립 매니저 */
    spriteManager = new SpriteManager();
    /** 비디오 클립 매니저 */
    videoManager = new VideoManager();
    /** 파티클 클립 매니저 */
    particleManager = new ParticleManager();
    /** 에셋 로더 */
    loader;
    /** 모든 Loader에서 로드된 에셋의 통합 맵 */
    _assets = {};
    constructor(canvasOrOptions) {
      super();
      let canvasEl;
      let options = {};
      if (canvasOrOptions instanceof HTMLCanvasElement) {
        canvasEl = canvasOrOptions;
      } else {
        options = canvasOrOptions ?? {};
        canvasEl = options.canvas ?? this.createCanvas();
      }
      this.disableContextMenu = options.disableContextMenu ?? true;
      this._canvas = canvasEl;
      this.renderer = new Renderer2(canvasEl);
      this.loader = new Loader();
      this.loader.on("complete", ({ assets }) => {
        Object.assign(this._assets, assets);
      });
      this._setupMouseEvents(canvasEl);
      this._gravityProxy = new Proxy({ x: 0, y: 0 }, {
        get: (_, prop) => this.physics.engine.gravity[prop],
        set: (_, prop, value) => {
          this.physics.engine.gravity[prop] = value;
          return true;
        }
      });
    }
    createCanvas() {
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;";
      document.body.appendChild(canvas);
      window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
      return canvas;
    }
    // ─── 마우스 이벤트 ────────────────────────────────
    _setupMouseEvents(canvas) {
      const dispatch = (eventName, e) => {
        const wrapped = wrapMouseEvent(e);
        const hits = this._getHitObjects(wrapped);
        for (const obj of hits) {
          obj.emit(eventName, wrapped);
          if (wrapped._propagationStopped) return;
        }
        this.emit(eventName, hits[0], wrapped);
      };
      canvas.addEventListener("click", (e) => dispatch("click", e));
      canvas.addEventListener("dblclick", (e) => dispatch("dblclick", e));
      canvas.addEventListener("contextmenu", (e) => {
        if (this.disableContextMenu) {
          e.preventDefault();
        }
        dispatch("contextmenu", e);
      });
      canvas.addEventListener("mousedown", (e) => dispatch("mousedown", e));
      canvas.addEventListener("mouseup", (e) => dispatch("mouseup", e));
      canvas.addEventListener("mousemove", (e) => {
        const wrapped = wrapMouseEvent(e);
        const hits = this._getHitObjects(wrapped);
        const hitIds = new Set(hits.map((o) => o.attribute.id));
        for (const obj of hits) {
          if (!this._mouseOver.has(obj.attribute.id)) {
            this._mouseOver.add(obj.attribute.id);
            obj.emit("mouseover", wrapped);
            if (!wrapped._propagationStopped) this.emit("mouseover", obj, wrapped);
          }
          obj.emit("mousemove", wrapped);
          if (!wrapped._propagationStopped) this.emit("mousemove", obj, wrapped);
        }
        for (const id of Array.from(this._mouseOver)) {
          if (!hitIds.has(id)) {
            this._mouseOver.delete(id);
            const obj = Array.from(this.objects).find((o) => o.attribute.id === id);
            if (obj) {
              obj.emit("mouseout", wrapped);
              if (!wrapped._propagationStopped) this.emit("mouseout", obj, wrapped);
            }
          }
        }
      });
      canvas.addEventListener("mouseleave", (e) => {
        const wrapped = wrapMouseEvent(e);
        for (const id of Array.from(this._mouseOver)) {
          const obj = Array.from(this.objects).find((o) => o.attribute.id === id);
          if (obj) {
            obj.emit("mouseout", wrapped);
            if (!wrapped._propagationStopped) this.emit("mouseout", obj, wrapped);
          }
        }
        this._mouseOver.clear();
      });
    }
    /**
     * 화면좌표 기준으로 마우스 위치에 겹쳐지는 객체를 반환합니다. (AABB hit-test)
     */
    _getHitObjects(e) {
      const canvas = this._canvas;
      if (!canvas) return [];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX - canvas.width / 2;
      const mouseY = -((e.clientY - rect.top) * scaleY - canvas.height / 2);
      let camX = 0, camY = 0, camZ = 0;
      let camRotX = 0, camRotY = 0, camRotZ = 0;
      const activeCam = this.camera;
      if (activeCam) {
        camX = activeCam.transform.position.x;
        camY = activeCam.transform.position.y;
        camZ = activeCam.transform.position.z;
        camRotX = activeCam.transform.rotation.x || 0;
        camRotY = activeCam.transform.rotation.y || 0;
        camRotZ = activeCam.transform.rotation.z || 0;
      }
      const radX = -camRotX * Math.PI / 180;
      const radY = -camRotY * Math.PI / 180;
      const radZ = -camRotZ * Math.PI / 180;
      const focalLength = activeCam ? activeCam.attribute.focalLength ?? 100 : 100;
      const result = [];
      const modelMat = new Mat4();
      const pointInPoly = (px, py, poly) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x, yi = poly[i].y;
          const xj = poly[j].x, yj = poly[j].y;
          const intersect = yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };
      const objectsData = Array.from(this.objects).filter((obj) => obj.attribute.type !== "camera" && obj.style.display !== "none" && obj.style.pointerEvents).map((obj) => {
        const mat = obj.__worldMatrix;
        const wx = mat[12], wy = mat[13], wz = -mat[14];
        let dx = wx - camX;
        let dy = wy - camY;
        let dz = wz - camZ;
        if (radY !== 0) {
          const cosY = Math.cos(radY), sinY = Math.sin(radY);
          const nx = dx * cosY + dz * sinY;
          const nz = -dx * sinY + dz * cosY;
          dx = nx;
          dz = nz;
        }
        if (radX !== 0) {
          const cosX = Math.cos(radX), sinX = Math.sin(radX);
          const ny = dy * cosX - dz * sinX;
          const nz = dy * sinX + dz * cosX;
          dy = ny;
          dz = nz;
        }
        if (radZ !== 0) {
          const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);
          const nx = dx * cosZ - dy * sinZ;
          const ny = dx * sinZ + dy * cosZ;
          dx = nx;
          dy = ny;
        }
        return { obj, dx, dy, dz };
      }).filter((data) => data.dz >= 0).filter((data) => {
        const perspectiveScale = data.dz === 0 ? 1 : focalLength / data.dz;
        const screenX = data.dx * perspectiveScale;
        const screenY = data.dy * perspectiveScale;
        const baseW = data.obj.__renderedSize?.w ?? data.obj.style.width ?? 100;
        const baseH = data.obj.__renderedSize?.h ?? data.obj.style.height ?? 100;
        const w = baseW * perspectiveScale * Math.abs(data.obj.transform.scale.x);
        const h = baseH * perspectiveScale * Math.abs(data.obj.transform.scale.y);
        const safeRadius = w + h;
        if (Math.abs(mouseX - screenX) > safeRadius || Math.abs(mouseY - screenY) > safeRadius) {
          return false;
        }
        return true;
      }).sort((a, b) => {
        const zdiff = b.dz - a.dz;
        return zdiff !== 0 ? zdiff : a.obj.style.zIndex - b.obj.style.zIndex;
      });
      for (const { obj, dx, dy, dz } of objectsData) {
        const { transform, style } = obj;
        const perspectiveScale = dz === 0 ? 1 : focalLength / dz;
        const screenX = dx * perspectiveScale;
        const screenY = dy * perspectiveScale;
        const baseW = obj.__renderedSize?.w ?? style.width ?? 0;
        const baseH = obj.__renderedSize?.h ?? style.height ?? 0;
        const w = baseW * perspectiveScale * transform.scale.x;
        const h = baseH * perspectiveScale * transform.scale.y;
        if (w <= 0 || h <= 0) continue;
        modelMat.identity();
        modelMat.translate(new Vec3(screenX, screenY, 0));
        if (camRotY) modelMat.rotate(-camRotY * Math.PI / 180, AXIS_Y2);
        if (camRotX) modelMat.rotate(-camRotX * Math.PI / 180, AXIS_X2);
        if (camRotZ) modelMat.rotate(-camRotZ * Math.PI / 180, AXIS_Z2);
        const rot = transform.rotation;
        if (rot.z) modelMat.rotate(rot.z * Math.PI / 180, AXIS_Z2);
        if (rot.y) modelMat.rotate(rot.y * Math.PI / 180, AXIS_Y2);
        if (rot.x) modelMat.rotate(rot.x * Math.PI / 180, AXIS_X2);
        const pivot = transform.pivot;
        modelMat.translate(new Vec3(
          (0.5 - pivot.x) * w,
          -(0.5 - pivot.y) * h,
          0
        ));
        modelMat.scale(new Vec3(w, h, 1));
        const m = modelMat;
        const getPt = (px, py) => ({
          x: m[0] * px + m[4] * py + m[12],
          y: m[1] * px + m[5] * py + m[13]
        });
        const corners = [
          getPt(-0.5, -0.5),
          getPt(0.5, -0.5),
          getPt(0.5, 0.5),
          getPt(-0.5, 0.5)
        ];
        if (pointInPoly(mouseX, mouseY, corners)) {
          result.push(obj);
        }
      }
      return result;
    }
    /**
     * 월드에 연결된 캔버스 엘리먼트를 반환합니다.
     */
    get canvas() {
      return this._canvas;
    }
    /**
     * 월드의 중력 x, y 값. 직접 수정하거나 새 객체를 할당할 수 있습니다.
     */
    get gravity() {
      return this._gravityProxy;
    }
    set gravity(g) {
      this.physics.engine.gravity.x = g.x;
      this.physics.engine.gravity.y = g.y;
    }
    /**
     * 월드의 활성 카메라 객체를 반환합니다. 
     */
    get camera() {
      return this._activeCamera;
    }
    /**
     * 월드의 카메라를 특정 객체로 지정합니다. 카메라 객체만 지정할 수 있습니다.
     * `null`을 할당하면 기본 동작으로 돌아갑니다.
     */
    set camera(camera) {
      if (camera != null && camera.attribute.type !== "camera") {
        throw new Error("The assigned object must be of camera type.");
      }
      this._activeCamera = camera;
    }
    /**
     * CSS querySelector와 유사한 방식으로 오브젝트를 선택합니다.
     * 지원 셀렉터: `.className`, `#id`, `[attribute=value]`
     */
    select(query) {
      const all = Array.from(this.objects);
      const classMatches = query.match(/\.([a-zA-Z0-9_-]+)/g);
      const classes = classMatches ? classMatches.map((c) => c.slice(1)) : [];
      const attrRegex = /\[([a-zA-Z0-9_-]+)=([^\]]+)\]/g;
      const attrConditions = [];
      let match;
      while ((match = attrRegex.exec(query)) !== null) {
        const key = match[1].trim();
        const rawValue = match[2].trim();
        let parsedValue = rawValue;
        if (rawValue.startsWith('"') && rawValue.endsWith('"') || rawValue.startsWith("'") && rawValue.endsWith("'")) {
          parsedValue = rawValue.slice(1, -1);
        } else if (rawValue === "true") {
          parsedValue = true;
        } else if (rawValue === "false") {
          parsedValue = false;
        } else if (rawValue === "null") {
          parsedValue = null;
        } else if (!Number.isNaN(Number(rawValue)) && rawValue !== "") {
          parsedValue = Number(rawValue);
        }
        attrConditions.push({ key, parsedValue, rawValue });
      }
      if (classes.length === 0 && attrConditions.length === 0) {
        return [];
      }
      return all.filter((o) => {
        if (classes.length > 0) {
          const objClasses = (o.attribute.className || "").split(/\s+/).filter(Boolean);
          const hasAllClasses = classes.every((c) => objClasses.includes(c));
          if (!hasAllClasses) return false;
        }
        for (const cond of attrConditions) {
          const { key, parsedValue, rawValue } = cond;
          if (key.startsWith("data-")) {
            const dataKey = key.slice(5);
            if (o.dataset[dataKey] !== parsedValue) return false;
          } else if (key.startsWith("attr-")) {
            const attrKey = key.slice(5);
            const objVal = o.attribute[attrKey];
            if (objVal !== parsedValue && String(objVal) !== rawValue) return false;
          } else {
            return false;
          }
        }
        return true;
      });
    }
    /**
     * 에셋 로더를 생성합니다. 로드 완료 시 World 내부 에셋 맵에 자동으로 병합됩니다.
     * @deprecated world.loader를 직접 사용하십시오.
     */
    createLoader() {
      return this.loader;
    }
    // ─── Object 등록 ─────────────────────────────────────────
    _registerObject(obj) {
      this.objects.add(obj);
      obj.on("remove", (target) => {
        this.removeObject(target);
      });
    }
    // ─── Object 생성 ─────────────────────────────────────────
    createCamera(options) {
      const cam = new Camera2(options);
      cam.__world = this;
      if (options?.transform?.position?.z === void 0) {
        cam.transform.position.z = -(cam.attribute.focalLength ?? 100);
      }
      this._registerObject(cam);
      this._tryAddPhysics(cam);
      this.renderer.markSortDirty();
      return cam;
    }
    createRectangle(options) {
      const rect = new Rectangle(options);
      this._registerObject(rect);
      this._tryAddPhysics(rect, options?.style?.width, options?.style?.height);
      this._trackSortDirty(rect);
      this.renderer.markSortDirty();
      return rect;
    }
    createEllipse(options) {
      const el = new Ellipse(options);
      this._registerObject(el);
      this._tryAddPhysics(el, options?.style?.width, options?.style?.height);
      this._trackSortDirty(el);
      this.renderer.markSortDirty();
      return el;
    }
    createText(options) {
      const text = new Text(options);
      this._registerObject(text);
      this._trackSortDirty(text);
      this.renderer.markSortDirty();
      return text;
    }
    createImage(options) {
      const img = new LeviarImage(options);
      this._registerObject(img);
      this._trackSortDirty(img);
      this.renderer.markSortDirty();
      return img;
    }
    createVideo(options) {
      const video = new LeviarVideo(options);
      video.__setManager(this.videoManager);
      this._registerObject(video);
      this._trackSortDirty(video);
      this.renderer.markSortDirty();
      return video;
    }
    createSprite(options) {
      const sprite = new Sprite(options);
      sprite.__setManager(this.spriteManager);
      this._registerObject(sprite);
      this._trackSortDirty(sprite);
      this.renderer.markSortDirty();
      return sprite;
    }
    createParticle(options) {
      const particle = new Particle(options);
      particle.__setPhysics(this.physics);
      particle.__setManager(this.particleManager);
      this._registerObject(particle);
      this._trackSortDirty(particle);
      this.renderer.markSortDirty();
      return particle;
    }
    removeObject(obj) {
      this.physics.removeBody(obj);
      this.objects.delete(obj);
      this.renderer.removeTextEntry(obj.attribute.id);
      this.renderer.markSortDirty();
    }
    start() {
      if (this.rafId != null) return this;
      let prevTime = 0;
      const loop = (timestamp) => {
        if (prevTime !== 0) {
          this.physics.step(timestamp);
        }
        prevTime = timestamp;
        for (const obj of this.objects) {
          if (!obj.parent) {
            obj.__updateMatrixWorld();
          }
        }
        this.renderer.render(this.objects, this._assets, timestamp, this.camera);
        this.physics.syncObjectSizes(this.objects);
        this.emit("update", timestamp);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
      return this;
    }
    stop() {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      return this;
    }
    /**
     * 객체의 Z 좌표 또는 zIndex 변경 시 Z-Sort 캐시를 무효화합니다.
     */
    _trackSortDirty(obj) {
      obj.on("positionmodified", (axis) => {
        if (axis === "z") this.renderer.markSortDirty();
      });
      obj.on("cssmodified", (key) => {
        if (key === "zIndex" || key === "display") this.renderer.markSortDirty();
      });
    }
    _tryAddPhysics(obj, w, h) {
      if (!obj.attribute.physics) return;
      this.physics.addBody(obj, w ?? 32, h ?? 32);
      const resizeBody = () => {
        const sw = (obj.style.width ?? w ?? 32) * obj.transform.scale.x;
        const sh = (obj.style.height ?? h ?? 32) * obj.transform.scale.y;
        this.physics.updateBodySize(obj, sw, sh);
      };
      const CSS_RESIZE_KEYS = /* @__PURE__ */ new Set(["width", "height", "borderWidth", "margin"]);
      obj.on("cssmodified", (key) => {
        if (CSS_RESIZE_KEYS.has(key)) resizeBody();
      });
      obj.on("scalemodified", () => resizeBody());
    }
  };

  // src/core/Renderer.ts
  function _extractPropKeys(props) {
    const keys = [];
    if (props.style) keys.push("style");
    if (props.transform?.position) keys.push("transform.position");
    if (props.transform?.scale) keys.push("transform.scale");
    if (props.transform?.rotation) keys.push("transform.rotation");
    if (keys.length === 0) keys.push("__default__");
    return keys;
  }
  function _applyPropsImmediate(obj, props) {
    if (props.style) Object.assign(obj.style, props.style);
    if (props.transform?.position) Object.assign(obj.transform.position, props.transform.position);
    if (props.transform?.scale) Object.assign(obj.transform.scale, props.transform.scale);
    if (props.transform?.rotation) Object.assign(obj.transform.rotation, props.transform.rotation);
  }
  var Renderer3 = class {
    world;
    config;
    width;
    height;
    depth;
    _objects = /* @__PURE__ */ new Set();
    _isSkipping = false;
    // 커스텀 명령어들이 저장할 범용 상태 저장소
    state = /* @__PURE__ */ new Map();
    // ─── 카메라 변환 합성용 ─────────────────────────────────────
    camBaseObj = null;
    camOffsetObj = null;
    _camSyncRafId = null;
    constructor(world, config, option) {
      this.world = world;
      this.config = config;
      this.width = option.width;
      this.height = option.height;
      this.depth = option.depth;
      if (!this.world.camera) {
        this.world.camera = this.world.createCamera();
      }
      this.world.camera.transform.position.z = 0;
      this._initCameraSync();
    }
    _initCameraSync() {
      this.camBaseObj = this.world.createRectangle({
        style: { width: 1, height: 1, opacity: 0.01, pointerEvents: false },
        transform: { position: { x: 0, y: 0, z: 0 } }
      });
      this.camOffsetObj = this.world.createRectangle({
        style: { width: 1, height: 1, opacity: 0.01, pointerEvents: false },
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { z: 0 } }
      });
      this.world.camera?.addChild(this.camBaseObj);
      this.world.camera?.addChild(this.camOffsetObj);
      const syncLoop = () => {
        if (this.world.camera && this.camBaseObj && this.camOffsetObj) {
          this.world.camera.transform.position.x = this.camBaseObj.transform.position.x + this.camOffsetObj.transform.position.x;
          this.world.camera.transform.position.y = this.camBaseObj.transform.position.y + this.camOffsetObj.transform.position.y;
          this.world.camera.transform.position.z = this.camBaseObj.transform.position.z + this.camOffsetObj.transform.position.z;
          if (this.world.camera.transform.rotation && this.camOffsetObj.transform.rotation) {
            this.world.camera.transform.rotation.z = this.camOffsetObj.transform.rotation.z;
          }
        }
        this._camSyncRafId = requestAnimationFrame(syncLoop);
      };
      this._camSyncRafId = requestAnimationFrame(syncLoop);
    }
    /**
     * 스킵 모드 상태를 설정합니다. 스킵 모드일 경우 애니메이션 시간이 0으로 처리됩니다.
     * @param flag 스킵 활성화 여부
     */
    setSkipping(flag) {
      this._isSkipping = flag;
    }
    /**
     * 스킵 모드 상태를 고려하여 실제 적용할 애니메이션 소요 시간(ms)을 반환합니다.
     * @param d 원본 소요 시간(ms)
     * @returns 스킵 중이면 0, 아니면 원본 시간
     */
    dur(d) {
      return this._isSkipping ? 0 : d;
    }
    /**
     * 객체에 애니메이션을 적용합니다. 
     * 이전에 진행 중이던 동일 속성의 애니메이션이 있다면 중단하고 즉시 목표값으로 스냅시킵니다.
     * 스킵 모드이거나 duration이 0인 경우 애니메이션 없이 즉시 속성을 적용합니다.
     * 
     * @param obj 애니메이션을 적용할 대상 객체
     * @param props 변경할 속성 객체 (예: { transform: { position: { x: 100 } } })
     * @param duration 애니메이션 소요 시간(ms)
     * @param easing 애니메이션 이징 함수
     * @param onEnd 애니메이션 종료 시 호출될 콜백 함수
     * @returns 생성된 애니메이션 인스턴스 (즉시 적용 시 null)
     */
    animate(obj, props, duration, easing = "linear", onEnd) {
      const d = this.dur(duration);
      const propKeys = _extractPropKeys(props);
      if (!obj.__activeAnims) obj.__activeAnims = /* @__PURE__ */ new Map();
      for (const key of propKeys) {
        const existing = obj.__activeAnims.get(key);
        if (existing?.anim) {
          existing.anim.stop?.();
          _applyPropsImmediate(obj, existing.target);
        }
      }
      if (d === 0) {
        _applyPropsImmediate(obj, props);
        for (const key of propKeys) obj.__activeAnims.delete(key);
        onEnd?.();
        return null;
      }
      const anim = obj.animate(props, d, easing);
      const entry = { anim, target: props };
      for (const key of propKeys) obj.__activeAnims.set(key, entry);
      const cleanup = () => {
        for (const key of propKeys) {
          if (obj.__activeAnims?.get(key) === entry) obj.__activeAnims.delete(key);
        }
      };
      anim.on("end", cleanup);
      if (onEnd) anim.on("end", onEnd);
      return anim;
    }
    /**
     * 렌더러가 관리할 객체를 추적 목록에 추가합니다.
     * 씬(Scene) 종료 시 추적된 객체들은 자동으로 화면에서 제거(clear)됩니다.
     * @param obj 추적할 객체
     */
    track(obj) {
      this._objects.add(obj);
      return obj;
    }
    /**
     * 지정된 객체를 추적 목록에서 제거합니다.
     * 더 이상 렌더러의 일괄 삭제 관리를 받지 않게 됩니다.
     * @param obj 추적 해제할 객체
     */
    untrack(obj) {
      this._objects.delete(obj);
    }
    /**
     * 세이브 저장을 위해 현재 렌더러의 뷰포트/카메라 상태와 커스텀 플러그인 상태를 캡처하여 반환합니다.
     */
    captureState() {
      const cam = this.world.camera;
      return {
        cameraState: {
          x: this.camBaseObj?.transform.position.x ?? cam?.transform.position.x ?? 0,
          y: this.camBaseObj?.transform.position.y ?? cam?.transform.position.y ?? 0,
          z: this.camBaseObj?.transform.position.z ?? cam?.transform.position.z ?? 0
        },
        pluginState: Object.fromEntries(
          Array.from(this.state.entries()).filter(([key, value]) => {
            if (key.startsWith("_")) return false;
            try {
              JSON.stringify(value);
              return true;
            } catch {
              return false;
            }
          })
        )
      };
    }
    /**
     * 로드 시 저장된 상태(state)를 기반으로 렌더러의 카메라 위치 및 커스텀 플러그인 상태를 복원합니다.
     */
    restoreState(state) {
      const cam = this.world.camera;
      if (cam && state.cameraState) {
        if (this.camBaseObj) {
          this.camBaseObj.transform.position.x = state.cameraState.x;
          this.camBaseObj.transform.position.y = state.cameraState.y;
          this.camBaseObj.transform.position.z = state.cameraState.z;
        }
        if (this.camOffsetObj) {
          this.camOffsetObj.transform.position.x = 0;
          this.camOffsetObj.transform.position.y = 0;
          this.camOffsetObj.transform.position.z = 0;
          if (this.camOffsetObj.transform.rotation) this.camOffsetObj.transform.rotation.z = 0;
        }
        cam.transform.position.x = state.cameraState.x;
        cam.transform.position.y = state.cameraState.y;
        cam.transform.position.z = state.cameraState.z;
      }
      this.state = new Map(Object.entries(state.pluginState || {}));
    }
    /**
     * pluginState 데이터를 기반으로 배경, 캐릭터, 무드, 이펙트를 화면에 재생성합니다.
     * restoreState() 이후 호출하여 실제 렌더링을 복원합니다.
     * @deprecated Novel._rebuildUI()로 이동됨. 직접 호출 시 Novel에서만 사용.
     */
    rebuildFromState() {
    }
    /**
     * 렌더러가 화면에 그린 모든 추적 객체를 제거하고, 커스텀 플러그인 상태 및 카메라 오프셋을 초기화합니다.
     * 주로 씬(Scene) 전환이나 종료 시 호출됩니다.
     */
    clear() {
      this._objects.forEach((obj) => obj.remove?.());
      this._objects.clear();
      this.state.clear();
      if (this.camOffsetObj) {
        this.camOffsetObj.transform.position.x = 0;
        this.camOffsetObj.transform.position.y = 0;
        this.camOffsetObj.transform.position.z = 0;
        if (this.camOffsetObj.transform.rotation) this.camOffsetObj.transform.rotation.z = 0;
      }
    }
  };

  // src/core/Scene.ts
  var BUILTIN_HANDLERS = {
    "dialogue": (p, c) => dialogue_default.__handler(p, c),
    "choice": (p, c) => choice_default.__handler(p, c),
    "condition": (p, c) => condition_default.__handler(p, c),
    "var": (p, c) => var_default.__handler(p, c),
    "label": (p, c) => label_default.__handler(p, c),
    "background": (p, c) => background_default.__handler(p, c),
    "mood": (p, c) => mood_default.__handler(p, c),
    "effect": (p, c) => effect_default.__handler(p, c),
    "overlay": (p, c) => overlay_default.__handler(p, c),
    "character": (p, c) => character_default.__handler(p, c),
    "character-focus": (p, c) => characterFocusModule.__handler(p, c),
    "character-highlight": (p, c) => characterHighlightModule.__handler(p, c),
    "camera-zoom": (p, c) => cameraZoomModule.__handler(p, c),
    "camera-pan": (p, c) => cameraPanModule.__handler(p, c),
    "camera-effect": (p, c) => cameraEffectModule.__handler(p, c),
    "screen-fade": (p, c) => screenFadeModule.__handler(p, c),
    "screen-flash": (p, c) => screenFlashModule.__handler(p, c),
    "screen-wipe": (p, c) => screenWipeModule.__handler(p, c),
    "ui": (p, c) => ui_default.__handler(p, c),
    "control": (p, c) => control_default.__handler(p, c)
  };
  var DialogueScene = class {
    renderer;
    callbacks;
    definition;
    /** 지역 변수. 씬 시작 시 localVars 초깃값으로 초기화 */
    localVars;
    /** 현재 커서 (dialogues 배열 인덱스) */
    cursor = 0;
    /** text 배열의 현재 표시 인덱스 */
    textSubIndex = 0;
    /** label name → 인덱스 맵 */
    labelIndex = /* @__PURE__ */ new Map();
    /** 사용자 입력 대기 중 여부 */
    _waitingInput = false;
    /** 씬 종료 여부 */
    _ended = false;
    constructor(renderer, callbacks, definition) {
      this.renderer = renderer;
      this.callbacks = callbacks;
      this.definition = definition;
      this.localVars = { ...definition.localVars ?? {} };
      this._buildLabelIndex();
    }
    _buildLabelIndex() {
      const steps = this.definition.dialogues;
      steps.forEach((step, i) => {
        if (step.type === "label") {
          const cmd = step;
          this.labelIndex.set(cmd.name, i);
        }
      });
    }
    /** 통합 변수 맵. 지역변수 키에 `_` 포함되어 있으므로 직접 spread */
    get _vars() {
      return { ...this.callbacks.getGlobalVars(), ...this.localVars };
    }
    _interpolateText(text) {
      return text.replace(/\{\{(.*?)\}\}/g, (_, expr) => {
        try {
          const vars = this._vars;
          const keys = Object.keys(vars);
          const values = Object.values(vars);
          const func = new Function(...keys, `return (${expr});`);
          return String(func(...values));
        } catch (e) {
          console.warn(`[leviar-novel] Template interpolation failed for expression: ${expr}`, e);
          return "";
        }
      });
    }
    /** 씬 실행 시작 */
    start() {
      this.cursor = 0;
      this.textSubIndex = 0;
      this._runInitial();
      this._executeNext();
    }
    /**
     * `definition.initial`에 정의된 데이터로 등록된 모듈의 View를 만듭니다.
     * `novel.config.modules`에 등록된 모듈의 `__viewBuilder`를 키로 찾아 호출합니다.
     */
    _runInitial() {
      const initial = this.definition.initial || {};
      const r = this.renderer;
      const modules = r.config.modules;
      if (!modules) return;
      const cmdStateStore = this.callbacks.getCmdStateStore();
      const uiRegistry = this.callbacks.getUIRegistry();
      const ctx = {
        world: r.world,
        globalVars: this.callbacks.getGlobalVars(),
        localVars: this.localVars,
        renderer: r,
        callbacks: this.callbacks,
        cmdState: {
          set: (name, data) => {
            cmdStateStore.set(name, data);
          },
          get: (name) => cmdStateStore.get(name)
        },
        ui: {
          register: (name, entry) => {
            uiRegistry.set(name, entry);
          },
          get: (name) => uiRegistry.get(name),
          show: (name, dur) => uiRegistry.get(name)?.show(dur),
          hide: (name, dur) => uiRegistry.get(name)?.hide(dur)
        },
        scene: {
          getTextSubIndex: () => this.textSubIndex,
          setTextSubIndex: (idx) => {
            this.textSubIndex = idx;
          },
          interpolateText: (text) => this._interpolateText(text),
          jumpToLabel: (label) => this._jumpToLabel(label),
          hasLabel: (label) => this.labelIndex.has(label),
          getVars: () => this._vars,
          setGlobalVar: (key, value) => this.callbacks.setGlobalVar(key, value),
          setLocalVar: (key, value) => {
            this.localVars[key] = value;
          },
          loadScene: (name) => this.callbacks.loadScene(name),
          end: () => {
            this._ended = true;
            this.callbacks.syncUIState();
          }
        },
        execute: (cmd) => this._executeCmd(cmd)
      };
      for (const [moduleKey, module] of Object.entries(modules)) {
        if (typeof module.__viewBuilder !== "function") continue;
        const initialData = initial[moduleKey];
        const mergedData = Object.assign({}, module.__schemaDefault, initialData ?? {});
        const entry = module.__viewBuilder(mergedData, ctx);
        uiRegistry.set(moduleKey, entry);
      }
    }
    /** 캐릭터 키를 실제 이름으로 변환 */
    _getSpeakerName(speakerKey) {
      if (!speakerKey) return void 0;
      const charDefs = this.renderer.config.characters;
      const def = charDefs?.[speakerKey];
      return def?.name ?? speakerKey;
    }
    /**
     * 사용자 입력(클릭/엔터)을 받아 다음 스텝으로 진행합니다.
     * Novel이 호출합니다.
     */
    advance() {
      if (!this._waitingInput || this._ended) return;
      this._waitingInput = false;
      this._executeNext();
    }
    _executeNext() {
      if (this._ended) return;
      const steps = this.definition.dialogues;
      if (this.cursor >= steps.length) {
        this._ended = true;
        this.callbacks.syncUIState();
        return;
      }
      const step = steps[this.cursor];
      const cmd = step;
      const result = this._executeCmd(cmd);
      if (result === "handled") {
        this.callbacks.syncUIState();
        return;
      }
      if (result === true || cmd.skip) {
        this.cursor++;
        this.textSubIndex = 0;
        this._executeNext();
      } else {
        this._waitingInput = true;
        this.callbacks.syncUIState();
      }
    }
    _jumpToLabel(label) {
      const idx = this.labelIndex.get(label);
      if (idx === void 0) {
        console.warn(`[leviar-novel] label '${label}' not found in scene '${this.definition.name}'`);
        this.cursor++;
        this.textSubIndex = 0;
        this._executeNext();
        return;
      }
      this.cursor = idx;
      this.textSubIndex = 0;
      this._executeNext();
    }
    _isFallbackMatch(cmd, rule) {
      if (!cmd || typeof cmd !== "object") return false;
      for (const key in rule) {
        if (key === "defaults") continue;
        const ruleVal = rule[key];
        if (ruleVal !== void 0 && cmd[key] !== ruleVal) return false;
      }
      return true;
    }
    /** 단일 커맨드를 실행 */
    _executeCmd(originalCmd) {
      const r = this.renderer;
      let cmd = originalCmd;
      const fallbacks = r.config.fallback;
      if (fallbacks && fallbacks.length > 0) {
        const defaultsToApply = {};
        for (let i = fallbacks.length - 1; i >= 0; i--) {
          const rule = fallbacks[i];
          if (this._isFallbackMatch(originalCmd, rule)) {
            Object.assign(defaultsToApply, rule.defaults);
          }
        }
        cmd = { ...defaultsToApply };
        for (const key in originalCmd) {
          if (originalCmd[key] !== void 0) {
            cmd[key] = originalCmd[key];
          }
        }
      }
      const { type, skip, ...params } = cmd;
      const cmdStateStore = this.callbacks.getCmdStateStore();
      const uiRegistry = this.callbacks.getUIRegistry();
      const ctx = {
        world: r.world,
        globalVars: this.callbacks.getGlobalVars(),
        localVars: this.localVars,
        renderer: r,
        callbacks: this.callbacks,
        cmdState: {
          set: (name, data) => {
            cmdStateStore.set(name, data);
          },
          get: (name) => cmdStateStore.get(name)
        },
        ui: {
          register: (name, entry) => {
            uiRegistry.set(name, entry);
          },
          get: (name) => uiRegistry.get(name),
          show: (name, dur) => uiRegistry.get(name)?.show(dur),
          hide: (name, dur) => uiRegistry.get(name)?.hide(dur)
        },
        scene: {
          getTextSubIndex: () => this.textSubIndex,
          setTextSubIndex: (idx) => {
            this.textSubIndex = idx;
          },
          interpolateText: (text) => this._interpolateText(text),
          jumpToLabel: (label) => this._jumpToLabel(label),
          hasLabel: (label) => this.labelIndex.has(label),
          getVars: () => this._vars,
          setGlobalVar: (key, value) => this.callbacks.setGlobalVar(key, value),
          setLocalVar: (key, value) => {
            this.localVars[key] = value;
          },
          loadScene: (name) => this.callbacks.loadScene(name),
          end: () => {
            this._ended = true;
            this.callbacks.syncUIState();
          }
        },
        execute: (cmd2) => this._executeCmd(cmd2)
      };
      const modules = r.config.modules;
      if (modules && typeof modules[type]?.__handler === "function") {
        return modules[type].__handler(params, ctx);
      }
      if (BUILTIN_HANDLERS[type]) {
        return BUILTIN_HANDLERS[type](params, ctx);
      }
      console.warn(`[leviar-novel] \uC54C \uC218 \uC5C6\uB294 \uCEE4\uB9E8\uB4DC \uD0C0\uC785:`, type);
      return false;
    }
    /** 현재 대기 중인 choice 커맨드를 반환 */
    getCurrentChoice() {
      if (this._ended) return null;
      const steps = this.definition.dialogues;
      const current = steps[this.cursor];
      if (current?.type === "choice") {
        return current;
      }
      return null;
    }
    /** 현재 대기 중인 dialogue 커맨드를 반환 */
    getCurrentDialogue() {
      if (this._ended) return null;
      const steps = this.definition.dialogues;
      const current = steps[this.cursor];
      if (current?.type === "dialogue") {
        const cmd = current;
        const displayIndex = Math.max(0, this.textSubIndex - 1);
        const txt = Array.isArray(cmd.text) ? cmd.text[displayIndex] : cmd.text;
        const interpolated = this._interpolateText(txt);
        const speakerName = this._getSpeakerName(cmd.speaker);
        return { ...cmd, text: interpolated, speaker: speakerName };
      }
      return null;
    }
    /** 선택지 선택 시 Novel이 호출합니다 */
    selectChoice(index) {
      const choice = this.getCurrentChoice();
      if (!choice) return;
      const selected = choice.choices[index];
      if (!selected) return;
      if (selected.var) {
        for (const [key, value] of Object.entries(selected.var)) {
          this.callbacks.setGlobalVar(key, value);
        }
      }
      if (selected.next) {
        this._ended = true;
        this.callbacks.loadScene(selected.next);
      } else if (selected.goto) {
        this._jumpToLabel(selected.goto);
      } else {
        this.cursor++;
        this.textSubIndex = 0;
        this._executeNext();
      }
    }
    // ─── 세이브/로드용 메서드 ────────────────────────────────────
    /** 현재 커서 위치 반환 (세이브용) */
    getCursor() {
      return this.cursor;
    }
    /** 현재 text 서브 인덱스 반환 (세이브용) */
    getTextSubIndex() {
      return this.textSubIndex;
    }
    /** 현재 지역 변수 반환 (세이브용) */
    getLocalVars() {
      return { ...this.localVars };
    }
    /**
     * 커서와 지역변수를 복원합니다 (로드용).
     * start()를 호출하지 않고 직접 상태를 복원합니다.
     */
    restoreState(cursor, localVars, textSubIndex = 0) {
      this.cursor = cursor;
      this.textSubIndex = textSubIndex;
      this.localVars = { ...localVars };
      this._ended = false;
      this._redisplayCurrentStep();
    }
    /**
     * 현재 cursor 위치의 step을 다시 표시합니다.
     * 로드 후 화면에 현재 상태를 복원할 때 사용합니다.
     */
    _redisplayCurrentStep() {
      const steps = this.definition.dialogues;
      const step = steps[this.cursor];
      if (!step) return;
      const cmd = step;
      const result = this._executeCmd(cmd);
      if (result === "handled") {
        this._waitingInput = true;
        this.callbacks.syncUIState();
      } else if (result === true || cmd.skip) {
        this.cursor++;
        this.textSubIndex = 0;
        this._executeNext();
      } else {
        this._waitingInput = true;
        this.callbacks.syncUIState();
      }
    }
    get isEnded() {
      return this._ended;
    }
    get isWaitingInput() {
      return this._waitingInput;
    }
  };
  var ExploreScene = class {
    renderer;
    callbacks;
    definition;
    _clickHandlers = [];
    _ended = false;
    constructor(renderer, callbacks, definition) {
      this.renderer = renderer;
      this.callbacks = callbacks;
      this.definition = definition;
    }
    start() {
      const { background, objects } = this.definition.options;
      setBackground(
        { renderer: this.renderer },
        background,
        "stretch",
        1e3
      );
      this._spawnObjects(objects);
    }
    _spawnObjects(objects) {
      objects.forEach((objDef) => {
        const world = this.renderer.world;
        const img = world.createImage({
          attribute: {
            src: objDef.src
          },
          style: {
            width: objDef.width ?? 100,
            height: objDef.height ?? 100,
            zIndex: 10
          },
          transform: {
            position: {
              x: objDef.position.x - this.renderer.width / 2,
              y: objDef.position.y - this.renderer.height / 2,
              z: 0
            }
          }
        });
        const handler = () => {
          if (this._ended) return;
          this._ended = true;
          this.callbacks.loadScene(objDef.next);
        };
        img.on("click", handler);
        this._clickHandlers.push({ obj: img, handler });
      });
    }
    cleanup() {
      this._clickHandlers.forEach(({ obj, handler }) => {
        obj.off?.("click", handler);
        obj.remove?.();
      });
      this._clickHandlers = [];
    }
    advance() {
    }
    get isEnded() {
      return this._ended;
    }
  };

  // src/core/Novel.ts
  var Novel = class {
    /** 전역 변수. 씬 전환에도 유지됩니다 */
    vars;
    _config;
    _option;
    _world;
    _renderer;
    _scenes = /* @__PURE__ */ new Map();
    /** CmdState — 씬 전환 후에도 유지, 세이브/로드 대상 */
    _cmdStateStore = /* @__PURE__ */ new Map();
    /**
     * 모듈 레지스트리 — Novel 생성 시 config.modules에서 자동 수집.
     * key: 모듈 이름, value: NovelModule 객체
     */
    _modules = /* @__PURE__ */ new Map();
    /** UI 런타임 레지스트리 — scene 실행 중 view 빌더가 등록 */
    _uiRegistry = /* @__PURE__ */ new Map();
    _currentScene = null;
    _currentSceneDef = null;
    _inputMode = "none";
    _isSkipping = false;
    /** 사용자 입력 무시 만료 시간 (ms) */
    _inputDisabledUntil = 0;
    constructor(config, option) {
      this._config = config;
      const canvas = option.canvas;
      this._option = {
        canvas,
        width: option.width ?? canvas.width,
        height: option.height ?? canvas.height,
        depth: option.depth ?? 500
      };
      this._world = new World({ canvas });
      this._renderer = new Renderer3(this._world, config, {
        width: this._option.width,
        height: this._option.height,
        depth: this._option.depth
      });
      this.vars = { ...config.vars };
      this._collectModules(config.modules);
      this._world.start();
      for (const [name, scene] of Object.entries(option.scenes)) {
        scene.name = name;
        this._scenes.set(name, scene);
      }
    }
    /**
     * config.modules를 순회하며 모듈을 _modules에 등록하고 key를 주입합니다.
     */
    _collectModules(modules) {
      if (!modules) return;
      for (const [key, module] of Object.entries(modules)) {
        if (module && typeof module.__setKey === "function") {
          module.__setKey(key);
          this._modules.set(key, module);
        }
      }
    }
    // ─── 에셋 로딩 ───────────────────────────────────────────────
    async load() {
      if (this._config.assets) {
        await this._world.loader.load(this._config.assets);
      }
    }
    /** config.assets 외 추가 에셋을 로드합니다 (SVG 인라인 등 런타임 생성 에셋). */
    async loadAssets(assets) {
      await this._world.loader.load(assets);
    }
    // ─── 씬 등록 ─────────────────────────────────────────────────
    register(scene) {
      this._scenes.set(scene.name, scene);
      return this;
    }
    // ─── 씬 시작/전환 ────────────────────────────────────────────
    start(name) {
      this.loadScene(name);
    }
    loadScene(name) {
      const def = this._scenes.get(name);
      if (!def) {
        console.error(`[leviar-novel] \uC52C '${name}'\uC774 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`);
        return;
      }
      const prevState = this._currentScene ? this._renderer.captureState() : null;
      if (this._currentScene instanceof ExploreScene) {
        this._currentScene.cleanup();
      }
      this._cleanupChoiceUI();
      this._currentScene = null;
      this._renderer.clear();
      if (prevState) {
        this._renderer.restoreState(prevState);
      }
      this._uiRegistry.clear();
      const callbacks = this._buildCallbacks();
      const scene = def.kind === "dialogue" ? new DialogueScene(this._renderer, callbacks, def) : new ExploreScene(this._renderer, callbacks, def);
      this._currentScene = scene;
      this._currentSceneDef = def;
      this._inputMode = "none";
      scene.start();
      this._syncUIState();
    }
    /** 씬 전환 시 choice HTML 컨테이너 정리 */
    _cleanupChoiceUI() {
      const choiceEntry = this._uiRegistry.get("choices");
      if (choiceEntry?.__novelRemove) {
        choiceEntry.__novelRemove();
      }
    }
    // ─── 스킵 기능 ───────────────────────────────────────────────
    /** 현재 스킵(빠른 감기) 중인지 여부 */
    get isSkipping() {
      return this._isSkipping;
    }
    /** 빠른 감기를 시작합니다. 선택지 또는 씬 종료 시 자동 중지됩니다. */
    skip() {
      if (this._isSkipping) return;
      this._isSkipping = true;
      this._renderer.setSkipping(true);
      this._tickSkip();
    }
    /** 빠른 감기를 중지합니다. */
    stopSkip() {
      this._isSkipping = false;
      this._renderer.setSkipping(false);
    }
    _tickSkip() {
      if (!this._isSkipping) return;
      if (!this._currentScene || this._currentScene.isEnded) {
        this.stopSkip();
        return;
      }
      if (!(this._currentScene instanceof DialogueScene)) {
        this.stopSkip();
        return;
      }
      if (this._currentScene.getCurrentChoice()) {
        this.stopSkip();
        return;
      }
      if (this._currentScene.isWaitingInput) {
        this._currentScene.advance();
        this._syncUIState();
      }
      if (this._isSkipping) {
        setTimeout(() => this._tickSkip(), 0);
      }
    }
    /**
     * hideable:true 로 등록된 모든 UI 요소를 숨깁니다.
     */
    hideUI(duration) {
      for (const entry of this._uiRegistry.values()) {
        entry.hide(duration);
      }
    }
    /**
     * hideUI()로 숨겼던 UI 요소를 다시 표시합니다.
     */
    showUI(duration) {
      for (const entry of this._uiRegistry.values()) {
        entry.show(duration);
      }
    }
    // ─── 세이브 / 로드 ───────────────────────────────────────────
    /**
     * 현재 진행 상태를 SaveData로 반환합니다.
     */
    save() {
      if (!this._currentScene || !(this._currentScene instanceof DialogueScene) || !this._currentSceneDef) {
        throw new Error("[leviar-novel] save()\uB294 DialogueScene \uC9C4\uD589 \uC911\uC5D0\uB9CC \uD638\uCD9C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      }
      return {
        sceneName: this._currentSceneDef.name,
        cursor: this._currentScene.getCursor(),
        globalVars: { ...this.vars },
        localVars: this._currentScene.getLocalVars(),
        rendererState: this._renderer.captureState(),
        cmdStates: Object.fromEntries(this._cmdStateStore)
      };
    }
    /**
     * SaveData로부터 진행 상태를 복원합니다.
     */
    loadSave(data) {
      const def = this._scenes.get(data.sceneName);
      if (!def || def.kind !== "dialogue") {
        console.error(`[leviar-novel] load() \uC2E4\uD328: \uC52C '${data.sceneName}'\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
        return;
      }
      if (this._currentScene instanceof ExploreScene) {
        this._currentScene.cleanup();
      }
      this._cleanupChoiceUI();
      this.stopSkip();
      Object.assign(this.vars, data.globalVars);
      this._cmdStateStore.clear();
      for (const [k, v] of Object.entries(data.cmdStates ?? {})) {
        this._cmdStateStore.set(k, v);
      }
      this._uiRegistry.clear();
      this._renderer.clear();
      this._renderer.restoreState(data.rendererState);
      this._renderer.rebuildFromState();
      this._rebuildModuleViews();
      const callbacks = this._buildCallbacks();
      const scene = new DialogueScene(this._renderer, callbacks, def);
      const subIndex = data.cmdStates?.["dialogue"]?.subIndex ?? 0;
      scene.restoreState(data.cursor, data.localVars, subIndex);
      this._currentScene = scene;
      this._currentSceneDef = def;
      this._inputMode = "none";
      this._syncUIState();
    }
    /**
     * 모든 등록된 모듈의 View 빌더를 실행하여 UI를 재생성합니다.
     * loadSave() 호출 후 실행됩니다.
     * 저장된 cmdState를 각 모듈의 View에 주입하여 상태를 복원합니다.
     */
    _rebuildModuleViews() {
      const ctx = this._makeRebuildCtx();
      for (const [name, module] of this._modules) {
        if (!module.__viewBuilder) continue;
        const savedState = this._cmdStateStore.get(name) ?? {};
        const entry = module.__viewBuilder(savedState, ctx);
        this._uiRegistry.set(name, entry);
      }
    }
    // ─── 콜백 팩토리 ─────────────────────────────────────────────
    _buildCallbacks() {
      return {
        getGlobalVars: () => ({ ...this.vars }),
        setGlobalVar: (name, value) => {
          this.vars[name] = value;
        },
        loadScene: (name) => {
          this.loadScene(name);
        },
        captureRenderer: () => this._renderer.captureState(),
        isSkipping: () => this._isSkipping,
        disableInput: (duration) => {
          this._inputDisabledUntil = Date.now() + duration;
        },
        getCmdStateStore: () => this._cmdStateStore,
        getUIRegistry: () => this._uiRegistry,
        syncUIState: () => {
          this._syncUIState();
        }
      };
    }
    // ─── 사용자 입력 ─────────────────────────────────────────────
    /**
     * 대화를 한 단계 진행합니다.
     */
    next() {
      if (Date.now() < this._inputDisabledUntil) return;
      if (this._inputMode !== "dialogue") return;
      if (!this._currentScene || this._currentScene.isEnded) return;
      const dialogueEntry = this._uiRegistry.get("dialogue");
      if (dialogueEntry?.isTyping?.()) {
        dialogueEntry.completeTyping?.();
        return;
      }
      this._currentScene.advance();
      this._syncUIState();
    }
    _syncUIState() {
      if (!this._currentScene || this._currentScene.isEnded) {
        this._inputMode = "none";
        if (this._currentScene?.isEnded && this._currentSceneDef?.kind === "dialogue") {
          const next = this._currentSceneDef.nextScene;
          if (next) {
            this.loadScene(next);
            return;
          }
        }
        return;
      }
      if (!(this._currentScene instanceof DialogueScene)) return;
      const choice = this._currentScene.getCurrentChoice();
      if (choice) {
        this._inputMode = "choice";
        return;
      }
      if (this._currentScene.isWaitingInput) {
        this._inputMode = "dialogue";
        return;
      }
      this._inputMode = "none";
    }
    // ─── rebuild용 SceneContext stub ────────────────────────────
    _makeRebuildCtx() {
      const noop = () => {
      };
      const cmdStateStore = this._cmdStateStore;
      const uiRegistry = this._uiRegistry;
      return {
        world: this._world,
        renderer: this._renderer,
        globalVars: {},
        localVars: {},
        callbacks: {
          getGlobalVars: () => ({}),
          setGlobalVar: noop,
          loadScene: noop,
          captureRenderer: () => this._renderer.captureState(),
          isSkipping: () => true,
          disableInput: noop,
          getCmdStateStore: () => cmdStateStore,
          getUIRegistry: () => uiRegistry,
          syncUIState: noop
        },
        cmdState: {
          set: (name, data) => {
            cmdStateStore.set(name, data);
          },
          get: (name) => cmdStateStore.get(name)
        },
        ui: {
          register: (name, entry) => {
            uiRegistry.set(name, entry);
          },
          get: (name) => uiRegistry.get(name),
          show: (name, dur) => uiRegistry.get(name)?.show(dur),
          hide: (name, dur) => uiRegistry.get(name)?.hide(dur)
        },
        scene: {
          getTextSubIndex: () => 0,
          setTextSubIndex: noop,
          interpolateText: (t) => t,
          jumpToLabel: noop,
          hasLabel: () => false,
          getVars: () => ({}),
          setGlobalVar: noop,
          setLocalVar: noop,
          loadScene: noop,
          end: noop
        },
        execute: () => false
      };
    }
  };

  // example/characters/chat.ts
  var chat_default = defineCharacter({
    name: "\uCC44\uD305\uCC3D",
    images: {}
  });

  // example/characters/zena.ts
  var zena_default = defineCharacter({
    name: "\uC81C\uB098",
    images: {
      normal: {
        src: "girl_normal",
        width: 350,
        points: {
          face: { x: 0.5, y: 0.18 },
          chest: { x: 0.5, y: 0.45 },
          legs: { x: 0.5, y: 0.55 }
        }
      },
      smile: {
        src: "girl_smile",
        width: 350,
        points: {
          face: { x: 0.5, y: 0.18 },
          chest: { x: 0.5, y: 0.45 }
        }
      }
    }
  });

  // example/novel.config.ts
  var testModule = define2();
  testModule.defineView((_data, _ctx) => ({ show: () => {
  }, hide: () => {
  } }));
  testModule.defineCommand((cmd, ctx) => {
    console.log("[test-cmd]", cmd.message, ctx.globalVars);
    return true;
  });
  var forModule = define2({ start: 0, end: 0, acc: 1 });
  forModule.defineView(() => ({ show: () => {
  }, hide: () => {
  } }));
  forModule.defineCommand((cmd, ctx, data) => {
    for (let i = cmd.start; i < cmd.end; i += cmd.acc ?? 1) {
      ctx.execute({ type: "dialogue", text: () => `dialog ${i}` });
      return false;
    }
    return true;
  });
  var novel_config_default = defineNovelConfig({
    vars: {
      likeability: 0,
      metHeroine: false,
      endingReached: false
    },
    modules: {
      "test-cmd": testModule,
      "for": forModule
    },
    scenes: [
      "scene-zena",
      "scene-zena-game",
      "scene-zena-food",
      "scene-zena-stream",
      "scene-zena-outside",
      "scene-zena-bug",
      "scene-zena-ending"
    ],
    characters: {
      "chat": chat_default,
      "zena": zena_default
    },
    backgrounds: {
      "bg-floor": { src: "bg_floor", parallax: true },
      "bg-library": { src: "bg_library", parallax: true },
      "bg-park": { src: "bg_park", parallax: true }
    },
    assets: {
      // 배경
      bg_floor: "./assets/bg_floor.png",
      bg_library: "./assets/bg_library.png",
      bg_park: "./assets/bg_park.png",
      // 캐릭터
      girl_normal: "./assets/girl_normal.png",
      girl_smile: "./assets/girl_smile.png",
      // 파티클
      dust: "./assets/particle_dust.png",
      rain: "./assets/particle_rain.png",
      snow: "./assets/particle_snow.png",
      sakura: "./assets/particle_sakura.png",
      fog: "./assets/particle_fog.png"
    },
    fallback: [
      { type: "character", action: "show", defaults: { duration: 300 } },
      { type: "character", action: "remove", defaults: { duration: 1e3 } }
    ]
  });

  // example/scenes/common-initial.ts
  var commonInitial = defineInitial(novel_config_default, {
    "dialogue": {
      bg: {
        color: "#00000000",
        gradientType: "linear",
        gradient: "0deg, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%",
        height: 168
      },
      speaker: {
        fontSize: 27,
        fontWeight: "bold",
        fontFamily: "Google Sans Flex,Google Sans,Helvetica Neue,sans-serif",
        color: "#daacffff",
        // borderWidth: 2,
        // borderColor: 'rgb(255,255,255)',
        textShadowOffsetX: 2,
        textShadowOffsetY: 2,
        textShadowBlur: 0,
        textShadowColor: "rgb(0,0,0)"
      },
      text: {
        fontSize: 18,
        fontFamily: "Google Sans Flex,Google Sans,Helvetica Neue,sans-serif",
        color: "#f0f0f0",
        lineHeight: 1.65
      }
    },
    "choice": {
      background: "rgba(20,20,50,0.90)",
      borderColor: "rgba(255,255,255,0.25)",
      hoverBackground: "rgba(80,60,180,0.92)",
      hoverBorderColor: "rgba(200,180,255,0.8)",
      borderRadius: 10,
      minWidth: 280
    }
  });

  // example/scenes/scene-zena.ts
  var scene_zena_default = defineScene({
    config: novel_config_default,
    variables: {
      _isAnnoyed: false,
      _test: 0
    },
    initial: commonInitial,
    next: "scene-zena-game"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0 },
    { type: "background", name: "bg-floor", duration: 0 },
    { type: "mood", mood: "day", intensity: 0.5, duration: 0 },
    { type: "screen-fade", dir: "in", preset: "black", duration: 1e3 },
    {
      type: "dialogue",
      text: "\uC8FC\uB9D0 \uC624\uD6C4\uC758 \uCE74\uD398. \uCC3D\uBC16\uC73C\uB85C \uB0B4\uB9AC\uCB10\uB294 \uD587\uC0B4\uC774 \uD3C9\uD654\uB86D\uB2E4."
    },
    { type: "for", start: 0, end: 10, acc: 1 },
    // { type: 'label', name: 'loop' },
    // { type: 'screen-flash', preset: 'red' },
    // { type: 'var', name: '_test', value: ({ _test }) => _test + 1 },
    // {
    //   type: 'dialogue',
    //   text: '{{ _test }}',
    // },
    // { type: 'condition', if: ({ _test }) => _test < 10, goto: 'loop' },
    {
      type: "dialogue",
      text: "\uD5A5\uAE0B\uD55C \uCEE4\uD53C \uD5A5\uACFC \uC0AC\uB78C\uB4E4\uC758 \uC6C5\uC131\uAC70\uB9BC \uC0AC\uC774\uB85C..."
    },
    {
      type: "dialogue",
      text: "\uAD6C\uC11D \uC790\uB9AC\uC5D0\uC11C \uC720\uB3C5 \uC774\uC9C8\uC801\uC778 \uC0B4\uAE30\uAC00 \uB290\uAEF4\uC84C\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uACF3\uC5D0\uB294 \uB9C8\uCE58 \uC138\uC0C1 \uBAA8\uB4E0 \uC9D0\uC744 \uC9CA\uC5B4\uC9C4 \uB4EF\uD55C \uD45C\uC815\uC758 \uC18C\uB140\uAC00 \uC788\uC5C8\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", focus: "face", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544... \uC778\uC0DD \uC9C4\uC9DC \uB85C\uADF8\uC544\uC6C3\uD558\uACE0 \uC2F6\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uC18C\uB140\uB294 \uAE08\uBC29\uC774\uB77C\uB3C4 \uBAA8\uB2C8\uD130\uB97C \uBD80\uC220 \uB4EF\uD55C \uAE30\uC138\uC600\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uC55E\uC5D0 \uB193\uC778 \uB178\uD2B8\uBD81\uC744 \uC8FD\uC77C \uB4EF\uC774 \uB178\uB824\uBCF4\uACE0 \uC788\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uB0B4\uAC00 \uD790\uB054 \uCCD0\uB2E4\uBCF4\uC790, \uC0B4\uBC8C\uD55C \uB208\uBE5B\uACFC \uB531 \uB9C8\uC8FC\uCCE4\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: '\uB108, \uD639\uC2DC \uC81C \uC5BC\uAD74\uC5D0 "\uB098 \uC624\uB298 \uAC13\uC0DD \uC0B4 \uAC70\uB2E4"\uB77C\uACE0 \uC4F0\uC5EC\uC788\uC5B4?'
    },
    {
      type: "dialogue",
      text: "\uCD08\uBA74\uC5D0 \uB2E4\uC9DC\uACE0\uC9DC \uC2DC\uBE44\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC65C \uD558\uD544 \uB0B4 \uC55E\uC5D0\uC11C \uADF8\uB807\uAC8C \uD574\uB9D1\uAC8C \uCEE4\uD53C\uB97C \uB9C8\uC2DC\uB294 \uAC70\uC57C?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC790\uBE44 \uC880 \uBCA0\uD480\uC5B4\uC918."
    },
    {
      type: "choice",
      choices: [
        { text: '"\uBB34\uC2A8 \uC77C \uD558\uC138\uC694?"\uB77C\uACE0 \uBB3B\uB294\uB2E4', goto: "ask-job" },
        { text: '"\uB178\uD2B8\uBD81\uC5D0 \uBC84\uADF8 \uB0AC\uB098\uC694?"\uB77C\uACE0 \uBB3B\uB294\uB2E4', goto: "ask-bug" },
        { text: "\uC870\uC6A9\uD788 \uC790\uB9AC\uB97C \uD53C\uD55C\uB2E4", goto: "escape" }
      ]
    },
    // ─── 분기: 일 질문 ───
    { type: "label", name: "ask-job" },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC77C? \uD558, \uBE44\uC988\uB2C8\uC2A4 \uD1A0\uD06C \uAE08\uC9C0\uC57C. \uC9C0\uAE08 \uB0B4 \uB450\uB1CC\uB294 404 Error \uC0C1\uD0DC\uB77C\uACE0."
    },
    {
      type: "dialogue",
      text: "\uB300\uCCB4 \uBB34\uC2A8 \uC77C\uC744 \uD558\uAE38\uB798 \uC0C1\uD0DC \uCF54\uB4DC\uB97C \uC785\uC5D0 \uB2EC\uACE0 \uC0AC\uB294 \uAC78\uAE4C."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADF8\uB0E5... \uC138\uC0C1\uC758 \uBAA8\uB4E0 \uCF54\uB4DC\uB97C \uC0AD\uC81C\uD558\uACE0 \uD3C9\uD654\uB85C\uC6B4 \uC790\uC5F0\uC778\uC73C\uB85C \uC0B4\uACE0 \uC2F6\uC744 \uBFD0\uC774\uC57C."
    },
    {
      type: "dialogue",
      text: "\uD655\uC2E4\uD788 \uC81C\uC815\uC2E0\uC740 \uC544\uB2CC \uAC83 \uAC19\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 500 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADFC\uB370 \uB108 \uCEE4\uD53C \uB9DB\uC788\uC5B4 \uBCF4\uC778\uB2E4. \uD55C \uC785\uB9CC?"
    },
    {
      type: "dialogue",
      text: "\uB0B4 \uCEE4\uD53C\uC794\uC744 \uD5A5\uD574 \uC190\uC744 \uBED7\uB294 \uD3FC\uC774 \uC2EC\uC0C1\uCE58 \uC54A\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544, \uB18D\uB2F4\uC774\uC57C. \uBC34(Ban) \uB2F9\uD558\uAE30 \uC2EB\uC73C\uBA74 \uC870\uC2EC\uD574."
    },
    { type: "condition", if: () => true, goto: "common-end" },
    // ─── 분기: 버그 질문 ───
    { type: "label", name: "ask-bug" },
    { type: "camera-effect", preset: "shake", duration: 400 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC84\uADF8?! \uB108, \uC9C0\uAE08 \uAE08\uAE30\uC5B4 \uC37C\uC5B4."
    },
    {
      type: "dialogue",
      text: "\uBC1C\uC791 \uC2A4\uC704\uCE58\uB97C \uB204\uB978 \uBAA8\uC591\uC774\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB0B4 \uC778\uC0DD \uC790\uCCB4\uAC00 \uAC70\uB300\uD55C \uBC84\uADF8\uC778\uB370 \uBB34\uC2A8 \uC18C\uB9B4 \uD558\uB294 \uAC70\uC57C?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC138\uBBF8\uCF5C\uB860 \uD558\uB098 \uB54C\uBB38\uC5D0 \uB0B4 \uC8FC\uB9D0\uC774 \uD1B5\uC9F8\uB85C \uB0A0\uC544\uAC14\uB2E4\uACE0! \uC774\uAC74 \uC778\uAD8C \uCE68\uD574\uC57C!"
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uD5C8\uACF5\uC5D0 \uB300\uACE0 \uC8FC\uBA39\uC9C8\uC744 \uD574\uB314\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "...\uADFC\uB370 \uB108 \uAC1C\uBC1C\uC790\uC57C? \uC544\uB2C8\uBA74 \uADF8\uB0E5 \uD6C8\uC218 \uB450\uB294 \uD558\uCCAD \uC5C5\uC790\uC57C?"
    },
    {
      type: "dialogue",
      text: "\uC758\uC2EC\uC2A4\uB7EC\uC6B4 \uB208\uCD08\uB9AC\uB85C \uC704\uC544\uB798\uB97C \uD6D1\uC5B4\uBCF8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB9D0\uD22C\uAC00 \uB531 \uD2B8\uC704\uCE58 \uCC44\uD305\uCC3D\uC778\uB370."
    },
    { type: "condition", if: () => true, goto: "common-end" },
    // ─── 분기: 도망 ───
    { type: "label", name: "escape" },
    {
      type: "dialogue",
      text: "\uB625\uC774 \uBB34\uC11C\uC6CC\uC11C \uD53C\uD558\uB098. \uB098\uB294 \uC2AC\uADF8\uBA38\uB2C8 \uC790\uB9AC\uC5D0\uC11C \uC77C\uC5B4\uB0AC\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC5B4? \uC5B4\uB51C \uB3C4\uB9DD\uAC00?"
    },
    {
      type: "dialogue",
      text: "\uBC88\uAC1C\uAC19\uC774 \uC190\uBAA9\uC744 \uBD99\uC7A1\uD614\uB2E4. \uC545\uB825\uC774 \uC7A5\uB09C\uC774 \uC544\uB2C8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC9C0\uAE08 \uB0B4 \uAE30\uBD84\uC774 \uB5A1\uB77D \uC911\uC778\uB370 \uAD00\uAC1D\uB3C4 \uC5C6\uC774 \uD63C\uC790 \uD654\uB098 \uC788\uC73C\uB77C\uACE0?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB108, \uC549\uC544."
    },
    {
      type: "dialogue",
      text: "\uB098\uB294 \uC58C\uC804\uD788 \uB2E4\uC2DC \uC790\uB9AC\uC5D0 \uC549\uC558\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC29\uAE08 \uB098\uB791 \uB208 \uB9C8\uC8FC\uCCE4\uC73C\uB2C8\uAE4C \uC774\uC81C \uC6B0\uB9B0 \uAD6C\uB3C5\uACFC \uC88B\uC544\uC694 \uAD00\uACC4\uC57C. \uB3C4\uB9DD \uBABB \uAC00."
    },
    { type: "condition", if: () => true, goto: "common-end" },
    // ─── 공통 엔딩 ───
    { type: "label", name: "common-end" },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD558... \uBAA8\uB974\uACA0\uB2E4. \uAC13\uC0DD\uC740 \uB0B4\uC77C\uBD80\uD130 \uC0B4\uC9C0 \uBB50."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uBBF8\uB828 \uC5C6\uC774 \uB178\uD2B8\uBD81 \uD654\uBA74\uC744 \uC808\uC804 \uBAA8\uB4DC\uB85C \uB3CC\uB838\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB108, \uB098\uB791 \uAC8C\uC784\uC774\uB098 \uD55C \uD310 \uB54C\uB9B4\uB798?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC694\uC998 \uC720\uD589\uD558\uB294 \uADF8 \uB625\uAC9C \uC788\uC5B4. \uBC84\uADF8 \uB369\uC5B4\uB9AC\uC778 \uAC70."
    },
    {
      type: "dialogue",
      text: "\uC544\uB2C8, \uBC29\uAE08 \uC804\uAE4C\uC9C0 \uBC84\uADF8 \uB54C\uBB38\uC5D0 \uD654\uB0B4\uC9C0 \uC54A\uC558\uB098?"
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uB300\uB2F5\uB3C4 \uB4E3\uC9C0 \uC54A\uACE0 \uB178\uD2B8\uBD81\uC744 \uCF85 \uB2EB\uC558\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB9AC\uACE0 \uAC00\uBC29\uC5D0\uC11C \uBAAC\uC2A4\uD130 \uC5D0\uB108\uC9C0 \uB4DC\uB9C1\uD06C\uB97C \uAEBC\uB0B4 \uC6D0\uC0F7\uC744 \uB54C\uB838\uB2E4."
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 2e3 },
    {
      type: "dialogue",
      text: "\uC774\uAC83\uC774 \uB098\uC640 \uC81C\uB098\uC758 \uB054\uCC0D\uD55C \uCCAB \uB9CC\uB0A8\uC774\uC5C8\uB2E4."
    }
  ]);

  // example/scenes/scene-zena-game.ts
  var scene_zena_game_default = defineScene({
    config: novel_config_default,
    variables: {
      _gameScore: 0,
      _zenaRage: 0
    },
    initial: commonInitial,
    next: "scene-zena-food"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0, skip: true },
    { type: "background", name: "bg-library", duration: 0, skip: true },
    { type: "mood", mood: "night", intensity: 0.7, duration: 0, skip: true },
    { type: "screen-fade", dir: "in", preset: "black", duration: 1e3, skip: true },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uC758 \uC544\uC9C0\uD2B8. \uB0A1\uC740 \uCC45\uC0C1 \uC704\uC5D0\uB294 \uD654\uB824\uD55C RGB \uC870\uBA85\uC774 \uBC88\uCA4D\uC774\uB294 \uD0A4\uBCF4\uB4DC\uC640 \uB4C0\uC5BC \uBAA8\uB2C8\uD130\uAC00 \uB193\uC5EC \uC788\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uBC29 \uC548\uC740 \uBA39\uB2E4 \uB0A8\uC740 \uCEF5\uB77C\uBA74 \uC6A9\uAE30\uC640 \uC815\uCCB4\uBD88\uBA85\uC758 \uC804\uC120\uB4E4\uB85C \uC5B4\uC9C0\uB7FD\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uD654\uBA74 \uC18D\uC5D0\uC11C\uB294 \uC815\uCCB4\uBD88\uBA85\uC758 \uBAAC\uC2A4\uD130\uAC00 \uAE30\uAD34\uD55C \uD3F4\uB9AC\uACE4\uC744 \uD769\uBFCC\uB9AC\uBA70 \uCDA4\uC744 \uCD94\uACE0 \uC788\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", focus: "face", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC790, \uBD10\uBD10. \uC774 \uAC8C\uC784\uC774 \uC5BC\uB9C8\uB098 \uAC13\uAC9C\uC774\uB0D0\uBA74..."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uBC18\uC9DD\uC774\uB294 \uB208\uBE5B\uC73C\uB85C \uBAA8\uB2C8\uD130\uB97C \uAC00\uB9AC\uCF30\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC5EC\uAE30\uC11C \uC810\uD504\uD0A4\uB97C \uC138 \uBC88 \uC5F0\uD0C0\uD558\uACE0 \uC549\uAE30\uB97C \uB204\uB974\uBA74 \uD558\uB298\uC744 \uB0A0 \uC218 \uC788\uC74C."
    },
    {
      type: "dialogue",
      text: "\uADF8\uAC8C \uBB34\uC2A8 \uBBF8\uCE5C \uC870\uC791\uBC95\uC778\uAC00 \uC2F6\uC9C0\uB9CC, \uD654\uBA74 \uC18D \uCE90\uB9AD\uD130\uB294 \uC815\uB9D0\uB85C \uACF5\uC911\uBD80\uC591\uC744 \uC2DC\uC791\uD588\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uBB3C\uB860 \uCC29\uC9C0\uD560 \uB550 \uB9F5\uC744 \uB6AB\uACE0 \uC9C0\uD558\uC2E4\uB85C \uB5A8\uC5B4\uC9C0\uC9C0\uB9CC.",
        "\uC644\uC804 \uC544\uD2B8 \uC544\uB2D8?"
      ]
    },
    {
      type: "dialogue",
      text: "\uC544\uB2C8, \uADF8\uAC74 \uADF8\uB0E5 \uCE58\uBA85\uC801\uC778 \uBC84\uADF8\uC796\uC544."
    },
    {
      type: "choice",
      choices: [
        { text: '"\uBC84\uADF8\uAC00 \uC544\uB2C8\uB77C \uAE30\uB2A5\uC774\uB124\uC694."', goto: "agree" },
        { text: '"\uADF8\uB0E5 \uB9DD\uAC9C \uC544\uB2C8\uC57C?"', goto: "disagree" }
      ]
    },
    // ─── 분기: 동의 ───
    { type: "label", name: "agree" },
    {
      type: "dialogue",
      text: '"\uBC84\uADF8\uAC00 \uC544\uB2C8\uB77C \uAE30\uB2A5\uC774\uB124\uC694."'
    },
    {
      type: "dialogue",
      text: "\uB0B4 \uC601\uD63C \uC5C6\uB294 \uB9AC\uC561\uC158\uC5D0\uB3C4 \uADF8\uB140\uB294 \uD06C\uAC8C \uAC10\uB3D9\uD55C \uB4EF\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB108 \uAF64 \uBC30\uC6B4 \uC0AC\uB78C\uC774\uB124."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uAC1C\uBC1C\uC790\uC758 \uC758\uB3C4\uB97C \uC644\uBCBD\uD788 \uD30C\uC545\uD588\uC5B4."
    },
    { type: "var", name: "likeability", value: 10 },
    { type: "condition", if: () => true, goto: "play-game" },
    // ─── 분기: 반대 ───
    { type: "label", name: "disagree" },
    {
      type: "dialogue",
      text: '"\uADF8\uB0E5 \uB9DD\uAC9C \uC544\uB2C8\uC57C?"'
    },
    {
      type: "dialogue",
      text: "\uD329\uD2B8\uB97C \uAF42\uC544\uB123\uC790, \uC81C\uB098\uC758 \uD45C\uC815\uC774 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uC369\uC5B4 \uB4E4\uC5B4\uAC14\uB2E4."
    },
    { type: "camera-effect", preset: "shake", duration: 300 },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB9DD\uAC9C\uC774\uB77C\uB2C8! \uC774\uAC74 \uC5B8\uB354\uB3C5\uC758 \uBC18\uB780\uC774\uC790 \uD3EC\uC2A4\uD2B8\uBAA8\uB354\uB2C8\uC998 \uC608\uC220\uC774\uB77C\uACE0!"
    },
    {
      type: "dialogue",
      text: "\uB418\uB3C4 \uC54A\uB294 \uAC1C\uB625\uCCA0\uD559\uC744 \uB4E4\uBA39\uC774\uBA70 \uB098\uB97C \uB9E4\uB3C4\uD55C\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD558... \uB108\uB294 \uC544\uC9C1 \uC774 \uC138\uACC4\uB97C \uC774\uD574\uD560 \uC900\uBE44\uAC00 \uC548 \uB41C \uAC70\uC57C."
    },
    {
      type: "dialogue",
      text: "\uC624\uD788\uB824 \uD3C9\uC0DD \uC774\uD574\uD558\uACE0 \uC2F6\uC9C0 \uC54A\uB2E4."
    },
    { type: "condition", if: () => true, goto: "play-game" },
    // ─── 게임 플레이 ───
    { type: "label", name: "play-game" },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 500 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC790, \uD328\uB4DC \uC7A1\uC544. \uBCF4\uC2A4\uC804\uC774\uC57C."
    },
    {
      type: "dialogue",
      text: "\uC5B4\uCA4C\uB2E4 \uBCF4\uB2C8 \uB098\uAE4C\uC9C0 \uB0A1\uC740 \uC5D1\uBC15 \uD328\uB4DC\uB97C \uAC74\uB124\uBC1B\uC558\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uAE30\uB984\uB54C\uAC00 \uBB3B\uC5B4\uC788\uB294 \uD328\uB4DC\uC5D0\uC11C\uB294 \uBBF8\uC138\uD558\uAC8C \uC591\uD30C\uB9C1 \uB0C4\uC0C8\uAC00 \uB0AC\uB2E4."
    },
    { type: "screen-flash", preset: "red", skip: true },
    { type: "camera-effect", preset: "shake", duration: 800 },
    {
      type: "dialogue",
      text: "\uC804\uD22C\uAC00 \uC2DC\uC791\uB418\uC790\uB9C8\uC790 \uD654\uBA74\uC774 \uAE30\uAD34\uD558\uAC8C \uC77C\uADF8\uB7EC\uC84C\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uB0B4 \uCE90\uB9AD\uD130\uAC00 \uAC11\uC790\uAE30 T\uD3EC\uC988\uB97C \uCDE8\uD558\uB354\uB2C8 \uD558\uB298\uB85C \uC19F\uAD6C\uCE58\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544... \uB610 \uD295\uACBC\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uC544\uBB34\uB807\uC9C0\uB3C4 \uC54A\uB2E4\uB294 \uB4EF \uD5C8\uD0C8\uD558\uAC8C \uD328\uB4DC\uB97C \uB0B4\uB824\uB193\uC558\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uC774\uB534 \uAC78 \uAC13\uAC9C\uC774\uB77C\uACE0 \uBD80\uB974\uB2E4\uB2C8, \uC138\uC0C1\uC774 \uC5B4\uB5BB\uAC8C \uB418\uBA39\uC740 \uAC78\uAE4C."
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uC640\uC758 \uAE30\uBB18\uD55C \uB625\uAC9C \uB370\uC774\uD2B8\uAC00 \uD5C8\uBB34\uD558\uAC8C \uB05D\uB0AC\uB2E4."
    }
  ]);

  // example/scenes/scene-zena-food.ts
  var scene_zena_food_default = defineScene({
    config: novel_config_default,
    initial: commonInitial,
    next: "scene-zena-stream"
  }, [
    { type: "background", name: "bg-library", duration: 0, skip: true },
    { type: "mood", mood: "night", intensity: 0.7, duration: 0, skip: true },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", duration: 0 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD558... \uAC8C\uC784 \uC5B5\uAE4C \uB2F9\uD574\uC11C \uBA58\uD0C8 \uD130\uC9C0\uB2C8\uAE4C \uBC30\uACE0\uD30C\uC84C\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uAC00 \uBC30\uB97C \uBD80\uC5EC\uC7A1\uC73C\uBA70 \uAE4A\uC740 \uD55C\uC228\uC744 \uC26C\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC778\uAC04\uC758 3\uB300 \uC695\uAD6C\uB294 \uCF54\uB529, \uC218\uBA74, \uC57C\uC2DD \uC544\uB2C8\uC57C?"
    },
    {
      type: "dialogue",
      text: '"\uC2DD\uC695\uC774 \uC544\uB2C8\uB77C \uC57C\uC2DD\uC774\uB77C\uACE0?"'
    },
    {
      type: "dialogue",
      text: "\uC5B4\uC774\uC5C6\uC5B4\uC11C \uD0DC\uD074\uC744 \uAC78\uC5C8\uC9C0\uB9CC, \uADF8\uB140\uB294 \uC544\uB791\uACF3\uD558\uC9C0 \uC54A\uC558\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB2F9\uC5F0\uD558\uC9C0. \uD604\uB300\uC778\uC5D0\uAC8C \uC57C\uC2DD\uC740 \uC911\uAEBE\uB9C8\uC758 \uC6D0\uCC9C\uC774\uC57C."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC911\uC694\uD55C \uAC74 \uAEBE\uC774\uC9C0 \uC54A\uB294 \uB9C8\uB77C\uB9DB."
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uB294 \uC2A4\uB9C8\uD2B8\uD3F0\uC744 \uAEBC\uB0B4 \uBC30\uB2EC \uC571\uC744 \uBBF8\uCE5C \uB4EF\uC774 \uC2A4\uD06C\uB864\uD558\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    {
      type: "choice",
      choices: [
        { text: '"\uBB34\uB09C\uD558\uAC8C \uCE58\uD0A8 \uC5B4\uB54C?"', goto: "chicken" },
        { text: '"\uC544\uAE4C \uB9E4\uC6B4 \uAC70 \uBA39\uACE0 \uC2F6\uB2E4\uBA70. \uC5FD\uAE30 \uB5A1\uBCF6\uC774?"', goto: "spicy" }
      ]
    },
    // ─── 치킨 ───
    { type: "label", name: "chicken" },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uCE58\uD0A8?",
        "\uB108 T\uC57C? \uACF5\uAC10 \uB2A5\uB825 \uC8FD\uC5C8\uB124.",
        "\uC694\uC998 \uB300\uC138\uB294 \uB9C8\uB77C\uB85C\uC81C\uD06C\uB9BC\uCE58\uC988\uCC1C\uB2ED\uC774\uC796\uC544."
      ]
    },
    {
      type: "dialogue",
      text: "\uADF8\uAC8C \uBB34\uC2A8 \uB054\uCC0D\uD55C \uD63C\uC885\uC778\uAC00."
    },
    { type: "dialogue", text: '"\uB9C8\uB77C\uC5D0 \uB85C\uC81C\uC5D0 \uD06C\uB9BC\uCE58\uC988...? \uC704\uC7A5 \uD14C\uB7EC \uC544\uB0D0?"' },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD14C\uB7EC\uBC29\uC9C0\uBC95\uC740 \uD1B5\uACFC\uB410\uC9C0\uB9CC, \uCC1C\uB2ED\uBC29\uC9C0\uBC95\uC740 \uC544\uC9C1\uC774\uAC70\uB4E0, \uB0B4\uAC00."
    },
    { type: "dialogue", text: "\uD560 \uB9D0\uC744 \uC783\uC5C8\uB2E4." },
    { type: "condition", if: () => true, goto: "order" },
    // ─── 매운거 ───
    { type: "label", name: "spicy" },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624, \uAE30\uC5B5\uB825 \uC88B\uC740\uB370? \uB300\uD654\uAC00 \uB41C\uB2E4 \uB300\uD654\uAC00."
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uAC00 \uB9CC\uC871\uC2A4\uB7EC\uC6B4 \uBBF8\uC18C\uB97C \uC9C0\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADFC\uB370 \uB9E4\uC6B4 \uAC70 \uBA39\uC73C\uBA74 \uB0B4 \uC704\uC7A5\uC774 \uC704\uD5D8\uD574\uC9C8 \uC218\uB3C4..."
    },
    { type: "dialogue", text: '"\uADF8\uB807\uB2E4\uBA74?"' },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADF8\uB7EC\uB2C8\uAE4C \uB9C8\uB77C\uB85C\uC81C\uD06C\uB9BC\uCE58\uC988\uCC1C\uB2ED\uC73C\uB85C \uAC04\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uB300\uCCB4 \uC5B4\uB514\uC11C\uBD80\uD130 \uD0DC\uD074\uC744 \uAC78\uC5B4\uC57C \uD560\uC9C0 \uBAA8\uB974\uACA0\uB2E4."
    },
    { type: "dialogue", text: "\uAE30\uC801\uC758 \uB17C\uB9AC\uB2E4." },
    { type: "condition", if: () => true, goto: "order" },
    // ─── 공통 주문 ───
    { type: "label", name: "order" },
    {
      type: "dialogue",
      text: "\uACB0\uAD6D \uAE30\uC2B9\uC804 \uCC1C\uB2ED, \uC644\uBCBD\uD55C \uB2F5\uC815\uB108\uC600\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uB294 \uC775\uC219\uD55C \uC190\uB180\uB9BC\uC73C\uB85C \uACB0\uC81C\uB97C \uB9C8\uCCE4\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC30\uB2EC 60\uBD84 \uAC78\uB9B0\uB300."
    },
    { type: "camera-effect", preset: "shake", duration: 300 },
    { type: "dialogue", text: '"\uC7A0\uAE50, \uBC29\uAE08 \uB0B4 \uD578\uB4DC\uD3F0\uC5D0\uC11C \uCE74\uB4DC \uACB0\uC81C \uC54C\uB9BC\uC774 \uC6B8\uB9B0 \uAC83 \uAC19\uC740\uB370?"' },
    {
      type: "dialogue",
      text: "\uB4F1\uACE8\uC774 \uC384\uD558\uAC8C \uC2DD\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC5B4, \uC74C\uC2DD \uC62C \uB54C\uAE4C\uC9C0 \uC2DC\uAC04 \uB0A8\uC558\uB124!"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC720\uD29C\uBE0C \uC20F\uD3FC\uC73C\uB85C \uB3C4\uD30C\uBBFC \uC880 \uCC44\uC6CC\uC57C\uC9C0~"
    },
    { type: "dialogue", text: "\uC81C\uB098\uB294 \uB0B4 \uB9D0\uC744 \uAE54\uB054\uD558\uAC8C \uC539\uC5B4\uBC84\uB838\uB2E4." },
    {
      type: "dialogue",
      text: "\uADF8\uB9AC\uACE0\uB294 \uACE7\uBC14\uB85C \uD654\uBA74 \uC18D \uC20F\uD3FC \uC601\uC0C1\uC73C\uB85C \uBE68\uB824 \uB4E4\uC5B4\uAC14\uB2E4."
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 1500 }
  ]);

  // example/scenes/scene-zena-stream.ts
  var scene_zena_stream_default = defineScene({
    config: novel_config_default,
    initial: commonInitial,
    next: "scene-zena-outside"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0, skip: true },
    { type: "background", name: "bg-library", duration: 0, skip: true },
    { type: "mood", mood: "night", intensity: 0.7, duration: 0, skip: true },
    { type: "screen-fade", dir: "in", preset: "black", duration: 1e3 },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", duration: 800 },
    {
      type: "dialogue",
      text: "\uBC30\uB2EC \uC74C\uC2DD\uC744 \uAE30\uB2E4\uB9AC\uBA70 \uC720\uD29C\uBE0C\uB97C \uBCF4\uB358 \uC81C\uB098\uAC00 \uAC11\uC790\uAE30 \uB9C8\uC774\uD06C \uC120\uC744 \uAC74\uB4DC\uB838\uB2E4."
    },
    { type: "camera-effect", preset: "shake", duration: 500 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC557, \uC7A0\uAE50!"
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uC758 \uC190\uB180\uB9BC\uC774 \uB2E4\uAE09\uD574\uC84C\uB2E4. \uB9C8\uC6B0\uC2A4\uB97C \uB9C8\uAD6C \uD074\uB9AD\uD558\uB294 \uC18C\uB9AC\uAC00 \uBC29 \uC548\uC744 \uCC44\uC6B4\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC774\uAC70 \uBC29\uC1A1 \uCF1C\uC9C4 \uAC70 \uC544\uB2C8\uC57C?!"
    },
    {
      type: "dialogue",
      text: "\uBC29\uC1A1 \uD504\uB85C\uADF8\uB7A8 \uD654\uBA74\uC5D0 \uBE68\uAC04 \uBD88\uC774 \uB4E4\uC5B4\uC628 \uAC83\uC744 \uD655\uC778\uD558\uC790, \uADF8\uB140\uC758 \uB3D9\uACF5\uC774 \uC9C0\uC9C4\uC744 \uC77C\uC73C\uCF30\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "...\uC5B4? \uCF1C\uC84C\uB124."
    },
    {
      type: "dialogue",
      text: "\uB180\uB78D\uAC8C\uB3C4, \uADF8 \uB2F9\uD669\uD568\uC740 \uB2E8 1\uCD08 \uB9CC\uC5D0 \uD754\uC801\uB3C4 \uC5C6\uC774 \uC0AC\uB77C\uC84C\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD558\uC774\uB8FD~ \uD2B8\uC218\uB4E4!"
    },
    {
      type: "dialogue",
      text: "\uBAA9\uC18C\uB9AC \uD1A4\uC774 \uB450 \uC625\uD0C0\uBE0C\uB294 \uC871\uD788 \uC62C\uB77C\uAC14\uB2E4. \uD3C9\uC18C\uC758 \uAC78\uAC78\uD55C \uBAA9\uC18C\uB9AC\uB294 \uC628\uB370\uAC04\uB370\uC5C6\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC29\uC1A1 \uC548 \uCF20\uB2E4\uACE0 \uD574\uB193\uACE0 \uC2E4\uC218\uB85C \uCF1C\uBC84\uB838\uB2E4!"
    },
    {
      type: "dialogue",
      text: "1\uCD08 \uB9CC\uC5D0 \uD150\uC158\uC774 180\uB3C4 \uBC14\uB00C\uC5C8\uB2E4. \uC778\uD130\uB137 \uBC29\uC1A1\uC778\uC758 \uC9C1\uC5C5\uBCD1\uC778\uAC00."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: [
        '<style color="rgb(150,150,150)">[ \uC557 \uAE30\uC2B5 \uBC45\uC628 \u3137\u3137 ]</style>',
        '<style color="rgb(150,150,150)">[ \uC624\uB298 \uD734\uBC29\uC774\uB77C\uBA70! \uD734\uBC29\uC774\uB77C\uBA70! ]</style>',
        '<style color="rgb(150,150,150)">[ \uD5D0\uB808\uBC8C\uB5A1 \uB4E4\uC5B4\uC654\uC2B5\uB2C8\uB2E4 \uC81C\uB098\uB2D8 ]</style>'
      ],
      speed: 10
    },
    {
      type: "dialogue",
      text: "\uD654\uBA74 \uC606\uC5D0 \uB744\uC6CC\uC9C4 \uCC44\uD305\uCC3D\uC774 \uC21C\uC2DD\uAC04\uC5D0 \uC2DC\uCCAD\uC790\uB4E4\uC758 \uBC18\uC751\uC73C\uB85C \uAC00\uB4DD \uCC3C\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: '<style color="rgb(150,150,150)">[ \uC329\uC5BC \uBC29\uC1A1\uC778\uAC00\uC694? ]</style>',
      speed: 10
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544\uB2C8\uC57C~ \uBC29\uAE08 \uC138\uC218\uD558\uACE0 \uC640\uC11C \uC644\uC804 \uC329\uC5BC\uC774\uAE34 \uD55C\uB370,"
    },
    {
      type: "dialogue",
      text: "\uBC29\uAE08 \uC804\uAE4C\uC9C0 \uAC8C\uC784\uC5D0\uC11C \uC5B5\uAE4C\uB2F9\uD588\uB2E4\uBA70 \uC0F7\uAC74\uC744 \uCE58\uB358 \uADF8 \uC778\uAC04\uC774 \uB9DE\uB098?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC6B0\uB9AC \uD2B8\uC218\uB4E4 \uBCF4\uACE0 \uC2F6\uC5B4\uC11C \uC7A0\uAE50 \uCF30\uC9C0~"
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uCE74\uBA54\uB77C\uB97C \uD5A5\uD574 \uB2A5\uC219\uD558\uAC8C \uC190\uD558\uD2B8\uB97C \uB0A0\uB838\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB0B4 \uC874\uC7AC\uB294 \uC644\uBCBD\uD558\uAC8C \uD22C\uBA85\uC778\uAC04 \uCDE8\uAE09\uC744 \uB2F9\uD558\uACE0 \uC788\uC5C8\uB2E4."
    },
    {
      type: "choice",
      choices: [
        { text: "\uCE74\uBA54\uB77C \uBC16\uC5D0\uC11C \uC870\uC6A9\uD788 \uC190\uC744 \uD754\uB4E4\uC5B4\uC900\uB2E4", goto: "wave" },
        { text: '"\uC57C, \uB0B4 \uCC1C\uB2ED\uC740 \uC5B8\uC81C \uC640?" \uB77C\uACE0 \uC18C\uB9AC\uCE5C\uB2E4', goto: "troll" }
      ]
    },
    { type: "label", name: "wave" },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624\uB298 \uC57C\uC2DD\uC740 \uCC1C\uB2ED \uC2DC\uCF30\uC5B4\uC6A9~"
    },
    {
      type: "dialogue",
      text: "\uB0B4 \uB3C8\uC73C\uB85C \uC2DC\uCF1C\uB193\uACE0 \uBCF8\uC778 \uC57C\uC2DD\uC778 \uAC83\uCC98\uB7FC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uD3EC\uC7A5\uD55C\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD63C\uC790 \uBA39\uAE30\uC5D4 \uC880 \uB9CE\uC9C0\uB9CC \uB0A8\uC73C\uBA74 \uB0BC \uBA39\uC5B4\uC57C\uC9C0!"
    },
    {
      type: "dialogue",
      text: "\uAC70\uC9D3\uB9D0\uC774 \uC220\uC220 \uB098\uC624\uB294 \uAF34\uC744 \uBCF4\uB2C8 \uAC00\uB9CC\uD788 \uC788\uC744 \uC218\uAC00 \uC5C6\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uB098\uB294 \uCE74\uBA54\uB77C \uC0AC\uAC01\uC9C0\uB300\uC5D0\uC11C \uC7A5\uB09C\uC2A4\uB7FD\uAC8C \uD314\uC744 \uBED7\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uD654\uBA74 \uAD6C\uC11D\uC5D0 \uB0B4 \uC190\uAC00\uB77D\uC774 1\uCD08\uCBE4 \uC7A1\uD614\uB2E4."
    },
    { type: "camera-effect", preset: "shake", duration: 300 },
    {
      type: "dialogue",
      text: "\uC21C\uAC04, \uBBF8\uCE5C \uB4EF\uC774 \uC62C\uB77C\uAC00\uB358 \uCC44\uD305\uCC3D\uC774 \uC77C\uC21C\uAC04 \uC5BC\uC5B4\uBD99\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB9AC\uACE0 \uB9E4\uC11C\uC6B4 \uC18D\uB3C4\uB85C \uB2E4\uC2DC \uB3C4\uBC30\uB418\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: [
        '<style color="rgb(150,150,150)">[ ??? ]</style>',
        '<style color="rgb(150,150,150)">[ \uBC29\uAE08 \uB0A8\uC790 \uC190 \uC544\uB2D8? ]</style>',
        '<style color="rgb(150,150,150)">[ \uC720\uB2C8\uCF58 \uBFD4 \uB2E4 \uBD80\uB7EC\uC9C0\uB294 \uC18C\uB9AC \uB4E4\uB9AC\uB124 ]</style>',
        '<style color="rgb(150,150,150)">[ \uB098 \uAE4C\uB9E4\uC838,,, ]</style>',
        '<style color="rgb(150,150,150)">[ \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 ]</style>'
      ],
      speed: 10
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uC758 \uC5BC\uAD74\uC774 \uC0AC\uC0C9\uC774 \uB418\uC5C8\uB2E4. \uADF8\uB140\uB294 \uB9C8\uC774\uD06C\uB97C \uD669\uAE09\uD788 \uAC00\uB838\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: '<style fontSize="14">\uBBF8\uCCE4\uC5B4?! \uC190 \uCE58\uC6CC!</style>'
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB098 \uC721\uC218 \uC6B0\uB824\uC11C \uBA39\uACE0\uC0AC\uB294 \uC2EC\uD574 \uBC29\uC1A1\uC774\uB780 \uB9D0\uC774\uC57C!"
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uB294 \uB2E4\uC2DC \uB9C8\uC774\uD06C\uC5D0\uC11C \uC190\uC744 \uB5BC\uACE0 \uC5B5\uC9C0\uC6C3\uC74C\uC744 \uC9C0\uC5C8\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544, \uC5EC\uB7EC\uBD84! \uBC29\uAE08 \uADF8\uAC70 \uC81C \uC190\uC774\uC5D0\uC694!"
    },
    {
      type: "dialogue",
      text: "\uB9D0\uB3C4 \uC548 \uB418\uB294 \uBCC0\uBA85\uC774\uB2E4. \uB204\uAC00 \uBD10\uB3C4 \uB450\uD23C\uD55C \uB0A8\uC790 \uC190\uC774\uC5C8\uB294\uB370."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC81C\uAC00 \uBF08\uB300 \uAD75\uC740 \uAC70 \uC544\uC2DC\uC796\uC544\uC694? \uD558\uD558\uD558!"
    },
    {
      type: "dialogue",
      text: "\uC5B4\uC124\uD508 \uD574\uBA85\uC774 \uD654\uB97C \uBD88\uB800\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uCC44\uD305\uCC3D\uC740 \uBFD4\uC774 \uBD80\uB7EC\uC9C4 \uC720\uB2C8\uCF58 \uB300\uC2E0 \uB2E4\uB978 \uBD80\uB958\uC758 \uC2DC\uCCAD\uC790\uB4E4\uB85C \uD3ED\uC8FC\uD558\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: [
        '<style color="rgb(150,150,150)">[ \uD615\uB2D8 \uC870\uC9C1\uC73C\uB85C \uB3CC\uC544\uC624\uC2ED\uC1FC ]</style>',
        '<style color="rgb(150,150,150)">[ \uC5EC\uAE30 \uB0A8\uCEA0\uBC29 \uB9DE\uC2B5\uB2C8\uB2E4 ]</style>',
        '<style color="rgb(150,150,150)">[ \uB098 \uC6D0 \uCC38 \u314B\u314B \uC81C \uBF08\uB300\uAC00 \uB2E8\uB2E8\uD574\uC84C\uC2B5\uB2C8\uB2E4 \uC774\uAC70\u314B\u314B\u314B ]</style>'
      ],
      speed: 10
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544\uB2C8\uC57C! \uD615 \uC544\uB2C8\uB77C\uACE0!"
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uAC00 \uD544\uC0AC\uC801\uC73C\uB85C \uD56D\uBCC0\uD588\uC9C0\uB9CC, \uCC44\uD305\uCC3D\uC758 \uD750\uB984\uC740 \uB9C9\uC744 \uC218 \uC5C6\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBBFC\uBC29\uC704 \uC548 \uB05D\uB0AC\uB0D0\uB2C8 \uC120 \uB118\uB124 \uC9C4\uC9DC!"
    },
    {
      type: "dialogue",
      text: "\uD654\uAC00 \uBA38\uB9AC\uB05D\uAE4C\uC9C0 \uB09C \uC81C\uB098\uAC00 \uB9C8\uCE68\uB0B4 \uC774\uC131\uC744 \uB193\uC544\uBC84\uB838\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC57C, \uB108 \uB54C\uBB38\uC5D0 \uCC44\uD305\uCC3D \uCC3D\uB0AC\uC796\uC544!"
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uAC00 \uB0B4 \uBA71\uC0B4\uC744 \uC7A1\uACE0 \uD754\uB4DC\uB294 \uC7A5\uBA74\uAE4C\uC9C0..."
    },
    {
      type: "dialogue",
      text: "\uCEA0 \uD654\uBA74\uC744 \uD1B5\uD574 \uACE0\uC2A4\uB780\uD788 \uC1A1\uCD9C\uB418\uACE0 \uB9D0\uC558\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: [
        '<style color="rgb(150,150,150)">[ \u314B\u314B\u314B\u314B \uD53C\uC9C0\uCEEC ]</style>',
        '<style color="rgb(150,150,150)">[ \uBA71\uC0B4\uC7A1\uC774 \uD569\uBC29 \uD3FC \uBBF8\uCCE4\uB2E4 ]</style>',
        '<style color="rgb(150,150,150)">[ \uB3C4\uD30C\uBBFC \uD130\uC9C0\uB124 ]</style>',
        '<style color="rgb(150,150,150)">[ \uC7AC\uBBF8\uB5D8 \uC7AC\uBBF8\uB5D8 \uC7AC\uBBF8\uB5D8 \uC7AC\uBBF8\uB5D8 \uC7AC\uBBF8\uB5D8 \uC7AC\uBBF8\uB5D8 ]</style>'
      ],
      speed: 10
    },
    { type: "condition", if: () => true, goto: "stream-end" },
    { type: "label", name: "troll" },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624\uB298 \uC57C\uC2DD\uC740 \uCC1C\uB2ED \uC2DC\uCF30\uC5B4\uC6A9~"
    },
    {
      type: "dialogue",
      text: "\uBC29\uAE08 \uC804\uAE4C\uC9C0 \uBD84\uB178\uC870\uC808\uC7A5\uC560\uB97C \uBCF4\uC774\uB358 \uC0AC\uB78C\uC774 \uB9DE\uB098 \uC2F6\uC744 \uC815\uB3C4\uB85C \uC559\uC99D\uB9DE\uC740 \uBAA9\uC18C\uB9AC\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC678\uB86D\uAC8C \uD63C\uC790 \uBA39\uBC29 \uD560 \uC608\uC815\uC774\uB2C8\uAE4C \uB2E4\uB4E4 \uB05D\uAE4C\uC9C0 \uBD10\uC918\uC57C \uD574?"
    },
    { type: "camera-effect", preset: "shake", duration: 300 },
    {
      type: "dialogue",
      text: "\uBED4\uBED4\uD55C \uBA58\uD2B8\uB97C \uB4E3\uC790\uB9C8\uC790 \uB098\uB3C4 \uBAA8\uB974\uAC8C \uC785\uC774 \uBA3C\uC800 \uC6C0\uC9C1\uC600\uB2E4."
    },
    {
      type: "dialogue",
      text: '"\uC57C, \uB0B4 \uCC1C\uB2ED\uC740 \uC5B8\uC81C \uC640?"'
    },
    {
      type: "dialogue",
      text: "\uB0B4\uAC00 \uB4A4\uC5D0\uC11C \uCA4C\uB801\uCA4C\uB801\uD558\uAC8C \uC678\uCE58\uC790, \uBC29 \uC548\uC758 \uACF5\uAE30\uAC00 \uC2F8\uB298\uD558\uAC8C \uC2DD\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB9AC\uACE0 1\uCD08\uC758 \uC815\uC801 \uD6C4, \uCC44\uD305\uCC3D\uC774 \uC21C\uC2DD\uAC04\uC5D0 \uBD88\uD0C0\uC624\uB974\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "chat",
      text: [
        '<style color="rgb(150,150,150)">[ \u314B\u314B\u314B\u314B \uB0A8\uC790 \uBAA9\uC18C\uB9AC \uBB50\uB0D0 ]</style>',
        '<style color="rgb(150,150,150)">[ \uB3D9\uAC70\uB0A8 \uCC1C\uB2ED\uC740 \uC911\uB300\uC0AC\uD56D\uC774\uC9C0 ]</style>',
        '<style color="rgb(150,150,150)">[ \uBFD4 \uB2E4 \uAC08\uB824\uC11C \uAC00\uB8E8 \uB428 ]</style>',
        '<style color="rgb(150,150,150)">[ \uCC44\uD305\uCC3D \uAE4C\uB9E4\uC9C0\uB294 \uAC70 \uBCF4\uC18C ]</style>',
        '<style color="rgb(150,150,150)">[ \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 \uC7AC\uBBF8\uC5C5\uB5D8 ]</style>'
      ],
      speed: 10
    },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uC758 \uC5BC\uAD74\uC5D0\uC11C \uC601\uC5C5\uC6A9 \uBBF8\uC18C\uAC00 \uC644\uC804\uD788 \uC99D\uBC1C\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC545! \uC57C! \uB108 \uC9C0\uAE08 \uBB50 \uD558\uB294 \uAC70\uC57C?!"
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uAC00 \uB0B4 \uCABD\uC744 \uD671 \uB178\uB824\uBCF4\uBA70 \uC0AC\uC790\uD6C4\uB97C \uB0B4\uC9C8\uB800\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uD558\uC9C0\uB9CC \uC774\uBBF8 \uC5CE\uC9C8\uB7EC\uC9C4 \uBB3C\uC774\uB2E4. \uCC44\uD305\uCC3D\uC758 \uD3ED\uC8FC\uB294 \uBA48\uCD9C \uAE30\uBBF8\uAC00 \uBCF4\uC774\uC9C0 \uC54A\uC558\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uB294 \uD669\uAE09\uD788 \uB2E4\uC2DC \uC5B5\uC9C0 \uBBF8\uC18C\uB97C \uC7A5\uCC29\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "...\uC544, \uC5EC\uB7EC\uBD84. \uBC29\uAE08 \uADF8\uAC74 \uC81C GPT\uC785\uB2C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "GPT\uAC00 \uCC1C\uB2ED\uC744 \uCC3E\uB0D0."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC30\uB2EC \uC54C\uB9BC \uAE30\uB2A5\uC774 \uC880 \uB9AC\uC5BC\uD558\uC8E0? \uB540\uB540..."
    },
    {
      type: "dialogue",
      text: "\uC544\uBB34\uB3C4 \uBBFF\uC9C0 \uC54A\uC744 \uBCC0\uBA85\uC744 \uB358\uC9C0\uACE0\uB294, \uADF8\uB140\uAC00 \uB2E4\uAE09\uD558\uAC8C \uB9C8\uC6B0\uC2A4\uB97C \uC950\uC5C8\uB2E4."
    },
    { type: "condition", if: () => true, goto: "stream-end" },
    { type: "label", name: "stream-end" },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624\uB298 \uBC29\uC1A1\uC740 3\uBD84 \uB9CC\uC5D0 \uBC29\uC885\uD558\uACA0\uC2B5\uB2C8\uB2E4! \u3143\u3143!"
    },
    {
      type: "dialogue",
      text: "\uB2E4\uAE09\uD55C \uC778\uC0AC\uC640 \uD568\uAED8 \uD654\uBA74\uC774 \uAEBC\uC84C\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      text: "\uBC29\uC1A1 \uC885\uB8CC \uBC84\uD2BC\uC744 \uB204\uB974\uC790\uB9C8\uC790 \uC81C\uB098\uB294..."
    },
    {
      type: "dialogue",
      text: "\uB2E4\uC2DC \uC601\uD63C \uC5C6\uB294, \uD145 \uBE48 \uB208\uB3D9\uC790\uB85C \uB3CC\uC544\uC654\uB2E4."
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 1500 }
  ]);

  // example/scenes/scene-zena-outside.ts
  var scene_zena_outside_default = defineScene({
    config: novel_config_default,
    initial: commonInitial,
    next: "scene-zena-bug"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0, skip: true },
    { type: "background", name: "bg-park", duration: 0, skip: true },
    { type: "mood", mood: "day", intensity: 1, duration: 0, skip: true },
    { type: "screen-fade", dir: "in", preset: "black", duration: 1e3 },
    {
      type: "dialogue",
      text: "\uB2E4\uC74C \uB0A0 \uC544\uCE68."
    },
    {
      type: "dialogue",
      text: "\uB098\uB294 \uC5B4\uC82F\uBC24 \uBC29\uC1A1 \uC0AC\uACE0\uC758 \uCDA9\uACA9\uC5D0\uC11C \uD5E4\uC5B4\uB098\uC624\uC9C0 \uBABB\uD558\uB294 \uC81C\uB098\uB97C \uAC15\uC81C\uB85C \uB04C\uACE0 \uB098\uC654\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uBC29\uAD6C\uC11D\uC5D0\uB9CC \uBC15\uD600\uC788\uB2E4\uAC00\uB294 \uC815\uB9D0\uB85C \uACF0\uD321\uC774\uAC00 \uD53C\uC5B4\uC624\uB97C \uAC83 \uAC19\uC558\uAE30 \uB54C\uBB38\uC774\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC545!"
    },
    {
      type: "dialogue",
      text: [
        "\uD587\uBE5B\uC744 \uCB10\uC790\uB9C8\uC790 \uC81C\uB098\uAC00 \uB208\uC744 \uAC10\uC2F8 \uC950\uBA70 \uBE44\uBA85\uC744 \uC9C8\uB800\uB2E4.",
        "\uAF2D \uD1F4\uB9C8\uB2F9\uD558\uB294 \uAC70 \uAC19\uB2E4."
      ]
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uD587\uBE5B \uC5D0\uC784\uD575 \uCF30\uB0D0! \uC774\uAC70 \uBE14\uB8E8\uB77C\uC774\uD2B8 \uD544\uD130 \uC548 \uB3FC?!"
    },
    {
      type: "dialogue",
      text: "\uC138\uC0C1\uC5D0 \uC5B4\uB5A4 \uD0DC\uC591\uC774 \uBE14\uB8E8\uB77C\uC774\uD2B8 \uD544\uD130\uB97C \uC9C0\uC6D0\uD55C\uB2E4\uB294 \uB9D0\uC778\uAC00."
    },
    {
      type: "choice",
      choices: [
        { text: '"\uAD11\uD569\uC131 \uC880 \uD574. \uCC3D\uBC31\uD574\uC11C \uBC40\uD30C\uC774\uC5B4\uC778 \uC904 \uC54C\uACA0\uB2E4."', goto: "sun" },
        { text: '"\uC57C\uC678 \uBC29\uC1A1 \uCF58\uD150\uCE20\uB77C\uACE0 \uC0DD\uAC01\uD574."', goto: "content" }
      ]
    },
    { type: "label", name: "sun" },
    {
      type: "dialogue",
      text: '"\uAD11\uD569\uC131 \uC880 \uD574. \uCC3D\uBC31\uD574\uC11C \uBC40\uD30C\uC774\uC5B4\uC778 \uC904 \uC54C\uACA0\uB2E4."'
    },
    {
      type: "dialogue",
      text: "\uB0B4 \uC9C0\uC801\uC5D0 \uC81C\uB098\uAC00 \uB367\uB2C8\uB97C \uB4DC\uB7EC\uB0B4\uBA70 \uC73C\uB974\uB801\uAC70\uB838\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBC40\uD30C\uC774\uC5B4\uBA74 \uB108\uBD80\uD130 \uBB3C\uC5C8\uC5B4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADFC\uB370 \uB10C \uD53C\uB3C4 \uB9DB\uC5C6\uAC8C \uC0DD\uACA8\uC11C \uBB3C\uAE30\uB3C4 \uC2EB\uC5B4."
    },
    {
      type: "dialogue",
      text: "\uC544\uCE68\uBD80\uD130 \uC2DC\uBE44 \uAC70\uB294 \uC19C\uC528\uAC00 \uBCF4\uD1B5\uC774 \uC544\uB2C8\uB2E4."
    },
    { type: "condition", if: () => true, goto: "walk" },
    { type: "label", name: "content" },
    { type: "character", action: "show", name: "zena", image: "normal", focus: "", duration: 300 },
    {
      type: "dialogue",
      text: '"\uC57C\uC678 \uBC29\uC1A1 \uCF58\uD150\uCE20\uB77C\uACE0 \uC0DD\uAC01\uD574."'
    },
    {
      type: "dialogue",
      text: "\uB0B4\uAC00 \uC5B4\uB974\uACE0 \uB2EC\uB798\uC790, \uC81C\uB098\uC758 \uADC0\uAC00 \uCAD1\uAE0B\uAC70\uB838\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624? \uCF58\uD150\uCE20?"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB108 \uC81C\uBC95 \uB9E4\uB2C8\uC800 \uB9C8\uC778\uB4DC\uAC00 \uC7A5\uCC29\uB410\uB124."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uAC00\uC0B0\uC810 +1\uC810 \uC8FC\uACA0\uC5B4."
    },
    {
      type: "dialogue",
      text: "\uB300\uCCB4 \uADF8 \uC810\uC218\uB294 \uC5B4\uB514\uB2E4 \uC4F0\uB294 \uAC74\uC9C0 \uBB3B\uACE0 \uC2F6\uC5C8\uC9C0\uB9CC \uAFB9 \uCC38\uC558\uB2E4."
    },
    { type: "condition", if: () => true, goto: "walk" },
    { type: "label", name: "walk" },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      text: "\uACB0\uAD6D \uADF8\uB140\uB294 \uC785\uC220\uC744 \uC090\uC8FD\uAC70\uB9AC\uBA74\uC11C\uB3C4 \uB098\uB97C \uB530\uB77C\uB098\uC130\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uC2AC\uB9AC\uD37C\uB97C \uC9C8\uC9C8 \uB04C\uBA70 \uCC9C\uCC9C\uD788 \uACF5\uC6D0 \uC0B0\uCC45\uB85C\uB97C \uAC77\uAE30 \uC2DC\uC791\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uBB50... \uB098\uC058\uC9C4 \uC54A\uB124."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uC8FC\uBCC0\uC758 \uB098\uBB34\uC640 \uD480\uAF43\uB4E4\uC744 \uC720\uC2EC\uD788 \uAD00\uCC30\uD588\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADF8\uB798\uD53D \uB80C\uB354\uB9C1\uB3C4 \uC798 \uB410\uACE0. \uD480 \uD14D\uC2A4\uCC98\uB3C4 \uB098\uB984 \uACE0\uD574\uC0C1\uB3C4\uACE0."
    },
    {
      type: "dialogue",
      text: "\uC790\uC5F0\uC744 \uBCF4\uACE0 \uB80C\uB354\uB9C1\uC744 \uC6B4\uC6B4\uD558\uB2E4\uB2C8, \uC774 \uB140\uC11D\uC758 \uB1CC \uAD6C\uC870\uB294 \uC815\uB9D0 \uC54C \uC218\uAC00 \uC5C6\uB2E4."
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 1500 }
  ]);

  // example/scenes/scene-zena-bug.ts
  var scene_zena_bug_default = defineScene({
    config: novel_config_default,
    initial: commonInitial,
    next: "scene-zena-ending"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0, skip: true },
    { type: "background", name: "bg-park", duration: 0, skip: true },
    { type: "mood", mood: "day", intensity: 0.5, duration: 0, skip: true },
    { type: "screen-fade", dir: "in", preset: "black", duration: 1e3 },
    { type: "character", action: "show", name: "zena", image: "normal", position: "center", duration: 0 },
    {
      type: "dialogue",
      text: [
        "\uACF5\uC6D0\uC744 \uAC77\uB358 \uC911,",
        "\uAC11\uC790\uAE30 \uC81C\uB098\uAC00 \uBC1C\uAC78\uC74C\uC744 \uBA48\uCD94\uACE0 \uAD73\uC5B4\uBC84\uB838\uB2E4."
      ]
    },
    { type: "camera-effect", preset: "shake", duration: 500 },
    { type: "character", action: "show", name: "zena", image: "normal", focus: "face", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uD5C9... \uC800, \uC800\uAE30...",
        "\uBC84\uADF8... \uB9AC\uC5BC \uC6D4\uB4DC \uBC84\uADF8 \uB5B4\uC5B4...!"
      ]
    },
    {
      type: "dialogue",
      text: [
        "\uADF8\uB140\uC758 \uC2DC\uC120 \uB05D\uC5D0\uB294",
        "\uD07C\uC9C0\uB9C9\uD55C \uB9E4\uBBF8 \uD55C \uB9C8\uB9AC\uAC00 \uBCA4\uCE58 \uC704\uC5D0 \uC549\uC544 \uC788\uC5C8\uB2E4."
      ]
    },
    {
      type: "choice",
      choices: [
        { text: "\uB9E4\uBBF8\uB97C \uB9E8\uC190\uC73C\uB85C \uC7A1\uC544\uC11C \uCE58\uC6CC\uC900\uB2E4", goto: "hero" },
        { text: "\uAC19\uC774 \uBE44\uBA85\uC744 \uC9C0\uB974\uBA70 \uB3C4\uB9DD\uAC04\uB2E4", goto: "run" },
        { text: "\uB9E4\uBBF8\uB97C \uC7A1\uC544\uC11C \uB4F1\uC5D0 \uBD99\uC5EC\uC900\uB2E4", goto: "prank" }
      ]
    },
    { type: "label", name: "hero" },
    {
      type: "dialogue",
      text: [
        "\uB0B4\uAC00 \uD0DC\uC5F0\uD558\uAC8C \uB9E4\uBBF8\uB97C \uC7A1\uC544 \uC232\uC73C\uB85C \uB0A0\uB824\uBCF4\uB0B4\uC790,",
        "\uC81C\uB098\uAC00 \uC874\uACBD\uC2A4\uB7EC\uC6B4 \uB208\uBE5B\uC73C\uB85C \uB098\uB97C \uBCF4\uC558\uB2E4."
      ]
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uBBF8\uCE5C \uD53C\uC9C0\uCEEC...",
        "\uB108 \uBC29\uAE08 \uB514\uBC84\uAE45 \uC18D\uB3C4 \uAC1C\uCA54\uC5C8\uC5B4. \uC778\uC815."
      ]
    },
    { type: "condition", if: () => true, goto: "calm" },
    { type: "label", name: "run" },
    { type: "camera-effect", preset: "shake", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uC73C\uC544\uC544\uC545!",
        "\uC11C\uBC84 \uD130\uC9C4\uB2E4! \uB3C4\uB9DD\uAC00!!!"
      ]
    },
    {
      type: "dialogue",
      text: [
        "\uC6B0\uB9AC\uB294 \uACF5\uC6D0 \uBC18 \uBC14\uD034\uB97C \uC804\uB825 \uC9C8\uC8FC\uD55C \uD6C4\uC5D0\uC57C",
        "\uACA8\uC6B0 \uBA48\uCDB0 \uC130\uB2E4."
      ]
    },
    { type: "condition", if: () => true, goto: "calm" },
    { type: "label", name: "calm" },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 500 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uD558\uC544... \uD558\uC544...",
        "\uC5ED\uC2DC \uD604\uC2E4 \uC138\uACC4\uB294 \uBC84\uADF8 \uB369\uC5B4\uB9AC\uC57C.",
        "\uBE68\uB9AC \uC544\uC9C0\uD2B8\uB85C \uBCF5\uADC0\uD558\uC790."
      ]
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 1500 },
    { type: "label", name: "prank" },
    {
      type: "dialogue",
      text: [
        "\uB098\uB294 \uC7AC\uBE68\uB9AC \uB9E4\uBBF8\uB97C \uB09A\uC544\uCC44\uC5B4 \uC81C\uB098\uC758 \uB4F1\uC5D0 \uC0B4\uD3EC\uC2DC \uBD99\uC600\uB2E4.",
        "\uB9E4\uBBF8\uAC00 \uB9F4\uB9F4 \uC6B8\uAE30 \uC2DC\uC791\uD558\uC790 \uC81C\uB098\uC758 \uB208\uB3D9\uC790\uAC00 \uBBF8\uCE5C\uB4EF\uC774 \uD754\uB4E4\uB838\uB2E4."
      ]
    },
    { type: "camera-effect", preset: "shake", intensity: 20, duration: 1e3 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uAE84\uC544\uC544\uC544\uC544\uC545!!! \uC57C \uC774 \uBBF8\uCE5C!!!",
        "\uB4F1\uC5D0! \uB4F1\uC5D0 \uBB54\uAC00 \uC9C4\uB3D9\uC774 \uC6B8\uB9AC\uC796\uC544!! \uB5BC \uC918!!!"
      ]
    },
    {
      type: "dialogue",
      text: [
        '"\uC77C\uB2E8 \uC815\uC0C1\uC801\uC73C\uB85C \uB9E4\uBBF8\uAC00 \uB4F1\uC5D0 \uC548\uCC29\uD574\uC11C \uB9F4\uB9F4 \uC18C\uB9AC\uB97C \uB0B4\uBA70 \uC791\uB3D9\uD558\uACE0 \uC788\uC73C\uB2C8,"',
        '"\uD568\uBD80\uB85C \uAC74\uB4DC\uB9AC\uC9C0 \uC54A\uB294 \uAC8C \uAC1C\uBC1C\uC790\uC758 \uCCA0\uCE59\uC774\uB2E4. \uC123\uBD88\uB9AC \uB5BC\uB824\uB2E4 \uB2E4\uB978 \uB370\uB85C \uD280\uBA74 \uB354 \uD070 \uBC84\uADF8\uAC00 \uC0DD\uACA8."'
      ]
    },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: [
        "\uBBF8\uCE5C \uC18C\uB9AC \uD558\uC9C0 \uB9C8\uC544\uC544\uC544!!",
        "\uC0B4\uB824\uC918\uC5B4\uC5B4!!!"
      ]
    },
    {
      type: "dialogue",
      text: [
        "\uC81C\uB098\uB294 \uACF5\uC6D0\uC744 \uBBF8\uCE5C \uB4EF\uC774 \uB6F0\uC5B4\uB2E4\uB2C8\uAE30 \uC2DC\uC791\uD588\uB2E4.",
        "\uAC15\uC81C \uB2EC\uB9AC\uAE30 \uC6B4\uB3D9\uC73C\uB85C \uC624\uB298\uCE58 \uCE7C\uB85C\uB9AC \uC18C\uBAA8\uB294 \uC644\uBCBD\uD558\uB2E4."
      ]
    }
  ]);

  // example/scenes/scene-zena-ending.ts
  var scene_zena_ending_default = defineScene({
    config: novel_config_default,
    initial: commonInitial,
    // 씬 5개 종료 후 처음으로 롤백
    next: "scene-zena"
  }, [
    { type: "screen-fade", dir: "out", preset: "black", duration: 0, skip: true },
    { type: "background", name: "bg-library", duration: 0, skip: true },
    { type: "mood", mood: "sunset", intensity: 0.8, duration: 0, skip: true },
    { type: "screen-fade", dir: "in", preset: "black", duration: 2e3 },
    {
      type: "dialogue",
      text: "\uC5B4\uB290\uC0C8 \uD574\uAC00 \uC9C0\uACE0, \uCC3D\uBC16\uC73C\uB85C \uBD89\uC740 \uB178\uC744\uC774 \uC2A4\uBA70\uB4E4\uACE0 \uC788\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uB2E4\uC0AC\uB2E4\uB09C\uD588\uB358 \uD558\uB8E8\uAC00 \uB05D\uC744 \uD5A5\uD574 \uAC00\uACE0 \uC788\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", position: "center", duration: 1e3 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC624\uB298 \uD018\uC2A4\uD2B8 \uAC19\uC774 \uB6F0\uC5B4\uC918\uC11C \uACE0\uB9C8\uC6CC."
    },
    {
      type: "dialogue",
      text: "\uADF8\uB140\uB294 \uB2E8\uC21C\uD55C \uC678\uCD9C\uC870\uCC28 \uD018\uC2A4\uD2B8\uB77C\uACE0 \uBD80\uB978\uB2E4."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC0AC\uC2E4 \uB098 \uD63C\uC790\uC11C\uB294 \uB098\uAC08 \uC5C4\uB450\uB3C4 \uBABB \uB0C8\uAC70\uB4E0."
    },
    {
      type: "dialogue",
      text: "\uC0B4\uC9DD \uC465\uC2A4\uB7EC\uC6B4 \uB4EF, \uC81C\uB098\uAC00 \uC2DC\uC120\uC744 \uD68C\uD53C\uD558\uBA70 \uBEA8\uC744 \uAE01\uC801\uC600\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "normal", duration: 500 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "...\uADFC\uB370 \uC880 \uC624\uAE00\uAC70\uB9AC\uB124."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544\uAE4C \uD55C \uB9D0\uC740 \uB864\uBC31\uD560\uAC8C. \uBABB \uB4E4\uC740 \uAC78\uB85C \uD574\uC918."
    },
    {
      type: "dialogue",
      text: "\uAE30\uAECF \uBD84\uC704\uAE30 \uC7A1\uC544\uB193\uACE0 1\uCD08 \uB9CC\uC5D0 \uCCA0\uD68C\uD55C\uB2E4."
    },
    {
      type: "choice",
      choices: [
        { text: '"\uC774\uBBF8 \uC138\uC774\uBE0C\uD588\uC5B4."', goto: "saved" },
        { text: '"\uADF8\uB798, \uB098\uB3C4 \uD53C\uACE4\uD558\uB2E4."', goto: "tired" }
      ]
    },
    { type: "label", name: "saved" },
    {
      type: "dialogue",
      text: '"\uC774\uBBF8 \uB0B4 \uB1CC\uC5D0 \uC138\uC774\uBE0C\uD588\uC5B4."'
    },
    {
      type: "dialogue",
      text: "\uC7A5\uB09C\uC2A4\uB7FD\uAC8C \uBC1B\uC544\uCE58\uC790, \uC81C\uB098\uC758 \uB208\uC774 \uCEE4\uC84C\uB2E4."
    },
    { type: "camera-effect", preset: "shake", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544, \uB370\uC774\uD130 \uAC15\uC81C \uC0AD\uC81C\uD560 \uAC70\uC57C!"
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uB0B4 \uD751\uC5ED\uC0AC \uD3F4\uB354\uC5D0 \uBD88\uBC95 \uC811\uADFC\uD558\uC9C0 \uB9C8!"
    },
    {
      type: "dialogue",
      text: "\uADC0\uB05D\uC774 \uC0C8\uBE68\uAC1C\uC9C4 \uC81C\uB098\uAC00 \uC560\uAFCE\uC740 \uD0A4\uBCF4\uB4DC \uC0F7\uAC74\uC744 \uCCE4\uB2E4."
    },
    { type: "condition", if: () => true, goto: "epilogue" },
    { type: "label", name: "tired" },
    {
      type: "dialogue",
      text: '"\uADF8\uB798, \uB098\uB3C4 \uD53C\uACE4\uD558\uB2E4. \uB2F9\uBD84\uAC04 \uC678\uCD9C\uC740 \uBB34\uB9AC\uC57C."'
    },
    {
      type: "dialogue",
      text: "\uACA9\uD558\uAC8C \uB3D9\uC758\uD574\uC8FC\uC790, \uADF8\uB140\uC758 \uC5BC\uAD74\uC5D0 \uC548\uB3C4\uAC10\uC774 \uBC88\uC84C\uB2E4."
    },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 300 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADF8\uCE58? \uB0B4\uC77C\uC740 \uAC01\uC790 \uC9D1\uC5D0\uC11C \uB514\uC2A4\uCF54\uB4DC\uB098 \uCF1C\uC790."
    },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uADF8\uAC8C \uC6B0\uB9AC\uB2E4\uC6B4 \uAC70\uC9C0."
    },
    {
      type: "dialogue",
      text: "\uD788\uD0A4\uCF54\uBAA8\uB9AC \uB3D9\uB9F9\uC774 \uACB0\uC131\uB418\uB294 \uC21C\uAC04\uC774\uC5C8\uB2E4."
    },
    { type: "condition", if: () => true, goto: "epilogue" },
    { type: "label", name: "epilogue" },
    { type: "character", action: "show", name: "zena", image: "smile", duration: 800 },
    {
      type: "dialogue",
      speaker: "zena",
      text: "\uC544\uBB34\uD2BC... \uC218\uACE0\uD588\uC5B4. \uD30C\uD2F0\uC6D0."
    },
    {
      type: "dialogue",
      text: "\uC81C\uB098\uB294 \uC791\uAC8C \uC6C3\uC73C\uBA70 \uB2E4\uC2DC \uD5E4\uB4DC\uC14B\uC744 \uC37C\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uBAA8\uB2C8\uD130 \uBD88\uBE5B\uC774 \uADF8\uB140\uC758 \uBEA8\uC744 \uC740\uC740\uD558\uAC8C \uBE44\uCD94\uC5C8\uB2E4."
    },
    {
      type: "dialogue",
      text: "\uD3C9\uBC94\uD558\uC9C0\uB9CC, \uBC84\uADF8 \uD22C\uC131\uC774\uC778 \uC77C\uC0C1\uC774 \uB2E4\uC2DC \uC2DC\uC791\uB418\uACE0 \uC788\uC5C8\uB2E4."
    },
    { type: "screen-fade", dir: "out", preset: "black", duration: 3e3 },
    { type: "dialogue", text: "\uC81C\uB098 \uC5D0\uD53C\uC18C\uB4DC\uAC00 \uBAA8\uB450 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }
  ]);

  // example/main.ts
  var svg = (body, w, h) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  )}`;
  var OBJECTS = {
    "obj-door": svg(`
    <rect width="90" height="160" fill="#8B4513" rx="6"/>
    <rect x="8" y="8" width="74" height="144" fill="#A0522D" rx="4"/>
    <rect x="8" y="8" width="74" height="68"  fill="#9b4f28" rx="4"/>
    <circle cx="68" cy="84" r="6" fill="#FFD700"/>
    <line x1="12" y1="80" x2="78" y2="80" stroke="#7a3a10" stroke-width="2"/>
    <text x="45" y="130" text-anchor="middle" fill="#ffd0a0" font-size="11" font-family="sans-serif">\uCC98\uC74C\uC73C\uB85C</text>
  `, 90, 160),
    "obj-window": svg(`
    <rect width="110" height="130" fill="#aaa" rx="4"/>
    <rect x="5" y="5" width="100" height="120" fill="#99ccff" rx="3"/>
    <line x1="55" y1="5"  x2="55" y2="125" stroke="#aaa" stroke-width="5"/>
    <line x1="5"  y1="65" x2="105" y2="65"  stroke="#aaa" stroke-width="5"/>
    <text x="55" y="115" text-anchor="middle" fill="#336" font-size="11" font-family="sans-serif">\uD6A8\uACFC \uC52C</text>
  `, 110, 130)
  };
  function showToast(msg, type = "success") {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = `toast toast-${type} show`;
    setTimeout(() => el.classList.remove("show"), 2200);
  }
  async function main() {
    const canvas = document.getElementById("canvas");
    const novel = new Novel(novel_config_default, {
      canvas,
      width: 800,
      height: 450,
      depth: 500,
      scenes: {
        "scene-zena": scene_zena_default,
        "scene-zena-game": scene_zena_game_default,
        "scene-zena-food": scene_zena_food_default,
        "scene-zena-stream": scene_zena_stream_default,
        "scene-zena-outside": scene_zena_outside_default,
        "scene-zena-bug": scene_zena_bug_default,
        "scene-zena-ending": scene_zena_ending_default
      }
    });
    await novel.load();
    await novel.loadAssets(OBJECTS);
    novel.start("scene-zena");
    const btnSkip = document.getElementById("btn-skip");
    const btnSave = document.getElementById("btn-save");
    const btnLoad = document.getElementById("btn-load");
    btnSkip.addEventListener("click", (e) => {
      e.stopPropagation();
      if (novel.isSkipping) {
        novel.stopSkip();
      } else {
        novel.skip();
      }
    });
    setInterval(() => {
      if (novel.isSkipping) {
        btnSkip.textContent = "\u23F9 \uC911\uC9C0";
        btnSkip.classList.add("active");
      } else {
        btnSkip.textContent = "\u23E9 Skip";
        btnSkip.classList.remove("active");
      }
    }, 300);
    btnSave.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        const data = novel.save();
        console.log(data);
        localStorage.setItem("leviar-novel-save", JSON.stringify(data));
        showToast("\u{1F4BE} \uC800\uC7A5 \uC644\uB8CC!", "success");
      } catch (e2) {
        console.error(e2);
        showToast("\u26A0 \uC800\uC7A5 \uC2E4\uD328: \uB300\uD654 \uC52C\uC5D0\uC11C\uB9CC \uAC00\uB2A5", "error");
      }
    });
    btnLoad.addEventListener("click", (e) => {
      e.stopPropagation();
      const raw = localStorage.getItem("leviar-novel-save");
      if (!raw) {
        showToast("\u{1F4C2} \uC800\uC7A5 \uB370\uC774\uD130 \uC5C6\uC74C", "info");
        return;
      }
      try {
        const data = JSON.parse(raw);
        novel.loadSave(data);
        showToast("\u{1F4C2} \uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC!", "success");
      } catch (e2) {
        console.error(e2);
        showToast("\u26A0 \uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328", "error");
      }
    });
    window.addEventListener("click", () => {
      novel.next();
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        novel.next();
      }
    });
  }
  main().catch(console.error);
})();
/*! Bundled license information:

leviar/dist/index.js:
  (*! Bundled license information:
  
  matter-js/build/matter.js:
    (*!
     * matter-js 0.20.0 by @liabru
     * http://brm.io/matter-js/
     * License MIT
     * 
     * The MIT License (MIT)
     * 
     * Copyright (c) Liam Brummitt and contributors.
     * 
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     * 
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     * 
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     *)
  *)
*/
//# sourceMappingURL=bundle.js.map
