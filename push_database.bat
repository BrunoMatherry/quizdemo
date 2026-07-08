@echo off
echo =======================================================
echo QuizMoz - Upload do Banco de Dados para o GitHub
echo =======================================================
echo.
cd temp-quizmoz-data
echo Sincronizando arquivos...
git add .
git commit -m "Update Nome Terra Portuguese database with 20 categories"
echo Enviando para o GitHub...
git push
echo.
echo Processo concluido!
pause
