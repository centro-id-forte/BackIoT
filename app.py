from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS
import os

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

# Conexión a MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database(os.getenv("DATABASE"))
collection = db.get_collection(os.getenv("COLLECTION"))  # Reemplaza con el nombre de tu colección

@app.route('/getIp', methods=['GET'])
def get_ip():
    # Obtener la IP del cliente
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    print(f'IP: {client_ip}')
    return jsonify({'ip': client_ip})

# Ruta para insertar un JSON en MongoDB con una fecha ISODate
@app.route('/insert', methods=['POST'])
def insert_data():
    data = request.json
    
    # Obtener la IP del cliente
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    
    # Imprimir la IP en consola
    print(f"Client IP: {client_ip}")

    if not data:
        return jsonify({"error": "No JSON data received"}), 400

    # Agregar la fecha actual en formato ISODate
    data['created_at'] = datetime.now()

    # Insertar en la base de datos
    collection.insert_one(data)

    return jsonify({"message": "Data inserted successfully"}), 201


# Ruta para obtener datos con un límite
@app.route('/getData', methods=['GET'])
def get_data():
    # Obtener la IP del cliente
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    
    # Imprimir la IP en consola
    print(f"Client IP: {client_ip}")

    # Obtener el parámetro 'num' de la URL, si no está presente, usar el valor por defecto de 20
    num = int(request.args.get('num', 20))

    # Obtener los documentos de la colección, limitados por el número especificado
    data = list(collection.find().sort("created_at", -1).limit(num))

    # Convertir los ObjectId y fechas en strings para que puedan ser serializados a JSON
    for doc in data:
        doc['_id'] = str(doc['_id'])
        if 'created_at' in doc:
            doc['created_at'] = doc['created_at'].isoformat()

    return jsonify(data), 200

# Ruta para obtener estadísticas de la colección
@app.route('/stats', methods=['GET'])
def get_collection_stats():
    # Pipeline de agregación para calcular tamaño y conteo
    pipeline = [
        {
            "$group": {
                "_id": None,
                "totalSize": {"$sum": "$size"},
                "docCount": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "totalSizeMB": "$totalSize",
                "docCount": 1
            }
        }
    ]

    # Ejecutar el pipeline y obtener el resultado
    result = list(collection.aggregate(pipeline))

    # Si hay resultados, devolver el primer elemento (ya que solo esperamos uno)
    if result:
        return jsonify(result[0]), 200
    else:
        return jsonify({"error": "No data found"}), 404

@app.route('/home')
def analisis():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
