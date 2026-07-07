export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      message: err.errors.map(e => e.message).join(', '),
    });
  }

  if (err.message?.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ status: 'error', message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'El archivo supera el tamaño máximo permitido' });
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ status: 'error', message });
}
