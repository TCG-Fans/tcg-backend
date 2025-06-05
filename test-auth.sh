#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Тестирование WalletConnect аутентификации ===${NC}"

# Адрес тестового кошелька (можно заменить на свой)
WALLET_ADDRESS="0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1"

# Базовый URL API
API_URL="http://localhost:3000/api"

echo -e "${BLUE}Шаг 1: Получение nonce для адреса ${WALLET_ADDRESS}${NC}"
NONCE_RESPONSE=$(curl -s "${API_URL}/auth/nonce/${WALLET_ADDRESS}")
echo "Ответ: $NONCE_RESPONSE"

# Извлечение nonce из ответа (требует jq)
if command -v jq &> /dev/null; then
    NONCE=$(echo $NONCE_RESPONSE | jq -r '.nonce')
    MESSAGE=$(echo $NONCE_RESPONSE | jq -r '.message')
    echo -e "${GREEN}Nonce: $NONCE${NC}"
    echo -e "${GREEN}Сообщение для подписи: $MESSAGE${NC}"
else
    echo -e "${RED}Для извлечения nonce требуется утилита jq. Пожалуйста, установите её.${NC}"
    echo -e "${RED}Например: brew install jq${NC}"
    echo -e "${RED}Или скопируйте nonce из ответа выше.${NC}"
    read -p "Введите nonce вручную: " NONCE
fi

echo -e "\n${BLUE}Шаг 2: Для подписи сообщения вам нужно использовать приватный ключ кошелька${NC}"
echo -e "${RED}Примечание: В реальном приложении подпись создаётся через WalletConnect на фронтенде${NC}"
echo -e "${RED}Для тестирования вам нужно создать подпись вручную с помощью MetaMask или другого инструмента${NC}"

read -p "Введите подпись сообщения (начинается с 0x): " SIGNATURE

if [ -z "$SIGNATURE" ]; then
    echo -e "${RED}Подпись не предоставлена. Завершение теста.${NC}"
    exit 1
fi

echo -e "\n${BLUE}Шаг 3: Верификация подписи${NC}"
VERIFY_RESPONSE=$(curl -s -X POST "${API_URL}/auth/verify" \
    -H "Content-Type: application/json" \
    -d "{\"walletAddress\":\"${WALLET_ADDRESS}\",\"signature\":\"${SIGNATURE}\"}")

echo "Ответ: $VERIFY_RESPONSE"

# Извлечение токена из ответа
if command -v jq &> /dev/null; then
    TOKEN=$(echo $VERIFY_RESPONSE | jq -r '.token // empty')
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}Аутентификация успешна!${NC}"
        echo -e "${GREEN}JWT токен: $TOKEN${NC}"
        
        echo -e "\n${BLUE}Шаг 4: Тестирование защищенного эндпоинта${NC}"
        USER_CARDS_RESPONSE=$(curl -s "${API_URL}/cards/user/${WALLET_ADDRESS}" \
            -H "Authorization: Bearer ${TOKEN}")
        
        echo "Ответ от защищенного эндпоинта: $USER_CARDS_RESPONSE"
        echo -e "${GREEN}Тест аутентификации завершен успешно!${NC}"
    else
        echo -e "${RED}Ошибка аутентификации. Проверьте подпись.${NC}"
    fi
else
    echo -e "${RED}Для извлечения токена требуется утилита jq.${NC}"
    echo -e "${RED}Проверьте ответ выше на наличие токена.${NC}"
fi
