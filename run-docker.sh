#!/bin/sh

# Color output helpers
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Управление Docker-контейнером IT-Инвентаризации ===${NC}"

show_help() {
    echo "Использование: ./run-docker.sh [команда]"
    echo ""
    echo "Команды:"
    echo "  start      - Собрать и запустить приложение в фоновом режиме (порт 8080)"
    echo "  stop       - Остановить работающие контейнеры"
    echo "  restart    - Перезапустить контейнеры"
    echo "  rebuild    - Пересобрать образ и запустить без использования кэша"
    echo "  logs       - Показать логи работающего контейнера"
    echo "  status     - Показать текущий статус контейнера"
}

if [ -z "$1" ]; then
    show_help
    exit 1
fi

case "$1" in
    start)
        echo -e "${YELLOW}Запуск контейнеров...${NC}"
        docker compose up -d --build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✔ Успешно запущен!${NC}"
            echo -e "${GREEN}Приложение доступно по адресу: http://localhost:8080${NC}"
        else
            echo -e "${RED}❌ Не удалось запустить Docker Compose. Проверьте запущен ли Docker daemon.${NC}"
        fi
        ;;
    stop)
        echo -e "${YELLOW}Остановка контейнеров...${NC}"
        docker compose down
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✔ Контейнеры успешно остановлены!${NC}"
        else
            echo -e "${RED}❌ Ошибка при остановке контейнеров.${NC}"
        fi
        ;;
    restart)
        echo -e "${YELLOW}Перезапуск контейнеров...${NC}"
        docker compose restart
        echo -e "${GREEN}✔ Перезапущено!${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Полная пересборка без кэша...${NC}"
        docker compose build --no-cache
        docker compose up -d
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✔ Пересборка завершена. Приложение работает на http://localhost:8080${NC}"
        else
            echo -e "${RED}❌ Ошибка при сборке.${NC}"
        fi
        ;;
    logs)
        docker compose logs -f
        ;;
    status)
        docker compose ps
        ;;
    *)
        show_help
        ;;
esac
