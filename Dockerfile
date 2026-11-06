FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_SITE_URL
ARG VITE_META_PIXEL_ID
ARG VITE_META_CURRENCY
ARG VITE_META_BRAND
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_META_PIXEL_ID=$VITE_META_PIXEL_ID
ENV VITE_META_CURRENCY=$VITE_META_CURRENCY
ENV VITE_META_BRAND=$VITE_META_BRAND

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
