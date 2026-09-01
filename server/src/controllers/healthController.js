export function getHealth(_request, response) {
  response.status(200).json({
    success: true,
    message: 'AI Hospital Management System API is running',
  });
}
