FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# 使用gunicorn作为生产环境的WSGI服务器
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:app"] 