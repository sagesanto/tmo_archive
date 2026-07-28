FROM python:3.11-slim

WORKDIR /app

COPY common/ /app/
COPY cutout_maker/ /app/

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "cutout_maker.py"]
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:$CUTOUT_BACKEND_PORT", "cutout_maker:app"]