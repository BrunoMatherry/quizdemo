# Regras de Customização do QuizMoz

## Regras de Build e Compilação
- **Build Web:** Sempre que houver alterações no código web (ficheiros em `/src` ou `index.html`), deve-se correr explicitamente o comando `npx vite build` no terminal para garantir que os ficheiros em `/dist` são atualizados corretamente. **NUNCA** usar `npm run build`, pois este comando falha de forma silenciosa no terminal local, mantendo a build antiga.
- **Sincronização Capacitor:** Após a compilação web de sucesso com `npx vite build`, deve-se rodar sempre `npx cap sync android` para copiar os novos assets para a pasta nativa do Android.
- **Geração de Binários (APK/AAB):** Sempre rodar `.\gradlew clean assembleDebug` ou `.\gradlew clean bundleRelease` a partir do diretório `/android` para que o Gradle compile de raiz sem caches antigos.

## Regras de AdMob (Atualizado para Todas as Idades)
- **Anúncios Intercalados (Interstitials):** Ativados para exibição controlada (ID: `ca-app-pub-1954059473041916/8572574831`). Só devem ser exibidos a cada 4 perdas do jogador (ao clicar em continuar a jogar) e opcionalmente na janela de pausa com recompensa. As funções `preloadInterstitial` e `showInterstitialAd` devem integrar o AdMob do Capacitor.
- **Rotulagem de Anúncios e Compras:** Qualquer oferta de anúncio premiado deve estar assinalada com `[ANÚNCIO]`, e qualquer compra deve estar assinalada com `[COMPRA]` ou `[COMPRA NO JOGO]`.
