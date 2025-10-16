FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir -U pip setuptools wheel
RUN pip install --no-cache-dir -e .
ENV ECHO_DB=/app/echo.db
EXPOSE 8000
CMD ["uvicorn", "echo_os.app:app", "--host", "0.0.0.0", "--port", "8000"]
