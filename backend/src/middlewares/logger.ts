
import type { RequestHandler } from "express";

export const logger: RequestHandler = (
  req,
  res,
  next
) => {
  const inicio = Date.now();

  res.on("finish", () => {
    const duracion = Date.now() - inicio;

    console.log(
      `[${res.locals.requestId}] ` +
      `${req.method} ${req.originalUrl} ` +
      `${res.statusCode} - ${duracion}ms`
    );
  });

  next();
};
