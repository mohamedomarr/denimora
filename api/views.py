from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_check(request):
    """
    Simple health check endpoint to verify API is working
    """
    return Response(
        {"status": "healthy", "message": "API is operational"},
        status=status.HTTP_200_OK
    ) 