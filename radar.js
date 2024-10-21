const radarSocket = new WebSocket('ws://localhost:4000');

radarSocket.onopen = () => {
    console.log('З\'єднано з WebSocket сервером');
};

radarSocket.onmessage = (event) => {
    const radarData = JSON.parse(event.data);
    console.log('Отримані дані:', radarData);
    renderChart(radarData);
};

radarSocket.onclose = () => {
    console.log('З\'єднання закрито');
};

radarSocket.onerror = (error) => {
    console.error('Помилка WebSocket:', error);
};

let targetPoints = [];
const POINT_LIFETIME = 4600; // Час в мілісекундах, протягом якого зберігаємо точки

function renderChart(data) {
    if (data.echoResponses.length > 0) {
        data.echoResponses.forEach(target => {
            const distance = (target.time * 300000) / 2; // Конвертуємо час у відстань (км)
            const signalPower = target.power;
            const color = getColorByPower(signalPower);
            targetPoints.push({
                distance: distance,
                angle: data.scanAngle,
                timestamp: Date.now(),
                color: color
            });
        });
    }

    // Очищення застарілих точок
    const currentTime = Date.now();
    targetPoints = targetPoints.filter(point => currentTime - point.timestamp < POINT_LIFETIME);

    // Оновлення графіка
    Plotly.react('chart', [{
        type: 'scatterpolar',
        r: targetPoints.map(point => point.distance),
        theta: targetPoints.map(point => point.angle),
        mode: 'markers',
        marker: { size: 15, color: targetPoints.map(point => point.color) },
    }], {
        polar: {
            radialaxis: { visible: true, title: '(км)', range: [0, 200] },
            angularaxis: { visible: true, range: [0, 360] }
        }
    });
}

function getColorByPower(power) {
    if (power > 0.7) {
        return 'red';
    } else if (power > 0.3) {
        return 'yellow';
    } else {
        return 'blue';
    }
}

function submitRadarConfig() {
    const measurements = parseInt(document.getElementById('measurementsPerRotation').value) || 360;
    const rotation = parseInt(document.getElementById('rotationSpeed').value) || 60;
    const targetSpeed = parseInt(document.getElementById('targetSpeed').value) || 100;

    const config = {
        measurementsPerRotation: measurements,
        rotationSpeed: rotation,
        targetSpeed: targetSpeed
    };

    fetch('http://localhost:4000/config', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Конфігурація оновлена:', data);
    })
    .catch(error => {
        console.error('Помилка при оновленні конфігурації:', error);
    });
}

// Зміна обробника події для кнопки
document.querySelector('button').addEventListener('click', submitRadarConfig);
