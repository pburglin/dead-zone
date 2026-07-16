package com.rocketenterprises.deadzone;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String GAME_URL = "https://dead-zone-last-stand.nqdn75t9hs.chatgpt.site/?platform=androidtv";
    private WebView gameView;
    private int axisX = 0;
    private int axisY = 0;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        gameView = new WebView(this);
        gameView.setBackgroundColor(Color.BLACK);
        gameView.setFocusable(true);
        gameView.setFocusableInTouchMode(true);
        WebSettings settings = gameView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " DeadZoneAndroidTV/1.0");
        gameView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                view.requestFocus();
                view.postDelayed(() -> focusPrimaryControl(), 350);
                view.postDelayed(() -> focusPrimaryControl(), 1200);
            }
        });
        setContentView(gameView);
        enterImmersiveMode();
        gameView.loadUrl(GAME_URL);
        gameView.requestFocus();
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) { enterImmersiveMode(); gameView.requestFocus(); }
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        String key = webKey(event.getKeyCode());
        if (key == null) return super.dispatchKeyEvent(event);
        if (event.getRepeatCount() > 0 && event.getAction() == KeyEvent.ACTION_DOWN) return true;
        sendKey(key, event.getAction() == KeyEvent.ACTION_DOWN);
        return true;
    }

    @Override public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_MOVE || !isController(event.getSource())) return super.dispatchGenericMotionEvent(event);
        float x = axis(event, MotionEvent.AXIS_HAT_X, MotionEvent.AXIS_X);
        float y = axis(event, MotionEvent.AXIS_HAT_Y, MotionEvent.AXIS_Y);
        int nextX = x < -.55f ? -1 : x > .55f ? 1 : 0;
        int nextY = y < -.55f ? -1 : y > .55f ? 1 : 0;
        if (nextX != axisX) { if (nextX < 0) pulse("ArrowLeft"); else if (nextX > 0) pulse("ArrowRight"); axisX = nextX; }
        if (nextY != axisY) { if (nextY < 0) pulse("ArrowUp"); else if (nextY > 0) pulse("ArrowDown"); axisY = nextY; }
        return true;
    }

    private boolean isController(int source) {
        return (source & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
                || (source & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
    }

    private float axis(MotionEvent event, int hat, int stick) {
        float value = event.getAxisValue(hat);
        return Math.abs(value) > .2f ? value : event.getAxisValue(stick);
    }

    private void pulse(String key) { sendKey(key, true); sendKey(key, false); }

    private void sendKey(String key, boolean down) {
        if (gameView == null) return;
        String script = "(function(){"
                + "var key='" + key + "',down=" + down + ";if(!down)return;"
                + "var selector='button:not(:disabled),a[href],input:not(:disabled),[tabindex=\\\"0\\\"]';"
                + "var layer=document.querySelector('.missionbrief,.modal,.victory,.defeat,.sessionnotice'),root=layer||document;"
                + "var items=Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function(el){return el.offsetParent!==null;});"
                + "var preferred=(layer&&layer.querySelector('[data-tv-primary]'))||(layer&&layer.querySelector(selector))||document.querySelector('[data-tv-primary]:not(:disabled),.mode-grid button:not(:disabled),.mission-cards button:not(:disabled),.online-options button:not(:disabled),.game button:not(:disabled),main button:not(:disabled):not(.global-audio button)')||items[0];"
                + "if(key==='Enter'){var active=document.activeElement,target=items.indexOf(active)>=0?active:preferred;if(target){target.focus();target.click();}return;}"
                + "if(key.indexOf('Arrow')===0){var before=document.activeElement;if(window.deadZoneNativeInput)window.deadZoneNativeInput(key,true);"
                + "if(document.activeElement!==before)return;var current=document.activeElement;if(items.indexOf(current)<0){if(preferred)preferred.focus();return;}"
                + "var a=current.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2,dir=key.replace('Arrow','').toLowerCase();"
                + "var candidates=items.filter(function(el){if(el===current)return false;var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return dir==='left'?x<ax:dir==='right'?x>ax:dir==='up'?y<ay:y>ay;})"
                + ".map(function(el){var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,primary=(dir==='left'||dir==='right')?Math.abs(x-ax):Math.abs(y-ay),cross=(dir==='left'||dir==='right')?Math.abs(y-ay):Math.abs(x-ax);return{el:el,score:primary+cross*2.4};})"
                + ".sort(function(a,b){return a.score-b.score;});if(candidates[0]){candidates[0].el.focus();candidates[0].el.scrollIntoView({block:'center',inline:'center'});}return;}"
                + "if(window.deadZoneNativeInput)window.deadZoneNativeInput(key,true);else window.dispatchEvent(new KeyboardEvent('keydown',{key:key.length===1?key.toLowerCase():key,code:key.length===1?'Key'+key.toUpperCase():key,bubbles:true}));"
                + "})();";
        gameView.evaluateJavascript(script, null);
    }

    private void focusPrimaryControl() {
        if (gameView == null) return;
        gameView.evaluateJavascript("(function(){var layer=document.querySelector('.missionbrief,.modal,.victory,.defeat,.sessionnotice'),el=(layer&&layer.querySelector('[data-tv-primary]'))||(layer&&layer.querySelector('button:not(:disabled),a[href],input:not(:disabled),[tabindex=\\\"0\\\"]'))||document.querySelector('[data-tv-primary]:not(:disabled),.mode-grid button:not(:disabled),.mission-cards button:not(:disabled),.online-options button:not(:disabled),.game button:not(:disabled),main button:not(:disabled):not(.global-audio button)');if(el)el.focus();})();", null);
    }

    private String webKey(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP: return "ArrowUp";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "ArrowDown";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "ArrowLeft";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "ArrowRight";
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_BUTTON_A: return "Enter";
            case KeyEvent.KEYCODE_BACK:
            case KeyEvent.KEYCODE_MENU:
            case KeyEvent.KEYCODE_BUTTON_B: return "Escape";
            case KeyEvent.KEYCODE_BUTTON_X: return "i";
            case KeyEvent.KEYCODE_BUTTON_Y: return "s";
            case KeyEvent.KEYCODE_BUTTON_L1: return "1";
            case KeyEvent.KEYCODE_BUTTON_R1:
            case KeyEvent.KEYCODE_BUTTON_START:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: return "Space";
            case KeyEvent.KEYCODE_BUTTON_L2: return "m";
            case KeyEvent.KEYCODE_BUTTON_R2: return "b";
            default: return null;
        }
    }

    @Override protected void onDestroy() {
        if (gameView != null) { gameView.destroy(); gameView = null; }
        super.onDestroy();
    }
}
