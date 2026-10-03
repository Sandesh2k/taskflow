export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiError(code: string, message: string, status = 400) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    } satisfies ApiErrorPayload,
    { status },
  );
}
