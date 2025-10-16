package com.idiottecnology.compgamerstore;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Registro explícito del plugin SocialLogin (evita problemas con scopes en Android)
        registerPlugin(SocialLoginPlugin.class);
    }
}
