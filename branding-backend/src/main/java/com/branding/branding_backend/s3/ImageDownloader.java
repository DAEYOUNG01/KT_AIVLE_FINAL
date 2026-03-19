package com.branding.branding_backend.s3;

import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@Component
public class ImageDownloader {

    public DownloadedImage download(String imageUrl) {
        HttpURLConnection connection = null;

        try {
            URL url = new URL(imageUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("이미지 다운로드 실패. HTTP status=" + status);
            }

            String contentType = connection.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("이미지가 아닙니다. contentType=" + contentType);
            }

            try (InputStream in = connection.getInputStream();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                byte[] buffer = new byte[4096];
                int bytesRead;

                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }

                byte[] bytes = out.toByteArray();
                if (bytes.length < 1024) {
                    throw new RuntimeException("이미지 데이터가 너무 작습니다.");
                }

                return new DownloadedImage(bytes, contentType);
            }

        } catch (Exception e) {
            throw new RuntimeException("이미지 다운로드 실패: " + imageUrl, e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}