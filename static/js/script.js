const serverIp = "9bb1-2806-103e-1e-52f1-8707-db9-1414-f293.ngrok-free.app";
const robotArmIp = "http://192.168.1.78"; // Reemplazar con la IP del brazo robótico
const servoPositions = [90, 90, 90, 90, 90, 90]; // Posiciones iniciales de los servos

const labels = [];
const tempData = [];
const humidityData = [];
const lightData = [];
const accelXData = [];
const accelYData = [];
const accelZData = [];
const gyroXData = [];
const gyroYData = [];
const gyroZData = [];

const minMaxValues = {
    temperature: { min: 20, max: 25 },
    humidity: { min: 40, max: 60 },
    light: { min: 0, max: 200 },
    accelX: { min: 0, max: 15000 },
    accelY: { min: 0, max: 15000 },
    accelZ: { min: 0, max: 15000 },
    gyroX: { min: -20000, max: 20000 },
    gyroY: { min: -20000, max: 20000 },
    gyroZ: { min: -20000, max: 20000 }
};

function createChart(ctx, label, data, minMax) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }]
        },
        options: {
            scales: {
                y: {
                    min: minMax.min,
                    max: minMax.max,
                    title: {
                        display: true,
                        text: label
                    }
                }
            }
        }
    });
}

// Gráficos de sensores
const tempChart = createChart(document.getElementById('temperatureChart'), 'Temperature', tempData, minMaxValues.temperature);
const humidityChart = createChart(document.getElementById('humidityChart'), 'Humidity', humidityData, minMaxValues.humidity);
const lightChart = createChart(document.getElementById('lightChart'), 'Light', lightData, minMaxValues.light);
const accelXChart = createChart(document.getElementById('accelXChart'), 'Accel X', accelXData, minMaxValues.accelX);
const accelYChart = createChart(document.getElementById('accelYChart'), 'Accel Y', accelYData, minMaxValues.accelY);
const accelZChart = createChart(document.getElementById('accelZChart'), 'Accel Z', accelZData, minMaxValues.accelZ);
const gyroXChart = createChart(document.getElementById('gyroXChart'), 'Gyro X', gyroXData, minMaxValues.gyroX);
const gyroYChart = createChart(document.getElementById('gyroYChart'), 'Gyro Y', gyroYData, minMaxValues.gyroY);
const gyroZChart = createChart(document.getElementById('gyroZChart'), 'Gyro Z', gyroZData, minMaxValues.gyroZ);

function fetchData() {
    fetch(serverIp + '/getData?num=20')
        .then(response => response.json())
        .then(data => {
            const latestData = data[data.length - 1]; // Obtener el último documento
            labels.push(new Date(latestData.created_at).toLocaleTimeString());
            tempData.push(latestData.temperature);
            humidityData.push(latestData.humidity);
            lightData.push(latestData.light);
            accelXData.push(latestData.accelX);
            accelYData.push(latestData.accelY);
            accelZData.push(latestData.accelZ);
            gyroXData.push(latestData.gyroX);
            gyroYData.push(latestData.gyroY);
            gyroZData.push(latestData.gyroZ);

            // Limitar a 20 puntos
            if (labels.length > 20) {
                labels.shift();
                tempData.shift();
                humidityData.shift();
                lightData.shift();
                accelXData.shift();
                accelYData.shift();
                accelZData.shift();
                gyroXData.shift();
                gyroYData.shift();
                gyroZData.shift();
            }

            // Actualizar los gráficos
            tempChart.update();
            humidityChart.update();
            lightChart.update();
            accelXChart.update();
            accelYChart.update();
            accelZChart.update();
            gyroXChart.update();
            gyroYChart.update();
            gyroZChart.update();
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Llamar a fetchData cada segundo
setInterval(fetchData, 1000);

// Actualizar posición de servo
function updateServo(servo) {
    const position = document.getElementById(`servo${servo}`).value;
    servoPositions[servo] = position; // Actualiza la posición del servo
    document.getElementById(`servo${servo}Val`).textContent = `${position}°`; // Actualiza el texto del valor
}

async function moveServos() {
    const body = {}; // Crear un objeto para el cuerpo del POST
    servoPositions.forEach((position, index) => {
        body[index + 1] = position; // Agregar todos los servos al objeto
    });

    console.log(body);

    try {
        const response = await fetch(`${robotArmIp}/move`, {
            method: "POST",
            mode: 'no-cors', // Añadir este modo
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error("Error en la respuesta del brazo:", response.statusText);
        }
    } catch (error) {
        console.error("Error al mover servos:", error);
    }
}

// Añadir eventos a los sliders
document.querySelectorAll('input[type="range"]').forEach((slider, index) => {
    slider.addEventListener('input', () => {
        servoPositions[index] = slider.value; // Actualizar la posición del servo
        document.getElementById(`servo${index}Val`).textContent = `${slider.value}°`; // Actualizar el valor mostrado
        moveServos(); // Llamar a moveServos
    });
});