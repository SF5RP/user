"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "@emotion/styled";
import { PageContainer, Container } from "@/shared/ui/container";
import Cookies from "js-cookie";

const LoadingCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  margin: 100px auto;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #5865f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Message = styled.p`
  font-size: 18px;
  color: #6c757d;
`;

function CallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      router.push("/login?error=" + error);
      return;
    }

    if (accessToken && refreshToken) {
      // Сохраняем токены в cookies
      Cookies.set("accessToken", accessToken, { expires: 7 });
      Cookies.set("refreshToken", refreshToken, { expires: 30 });
      router.push("/profile");
    } else {
      router.push("/login?error=missing_tokens");
    }
  }, [searchParams, router]);

  return (
    <PageContainer>
      <Container>
        <LoadingCard>
          <Spinner />
          <Message>Авторизация...</Message>
        </LoadingCard>
      </Container>
    </PageContainer>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Container>
            <LoadingCard>
              <Spinner />
              <Message>Загрузка...</Message>
            </LoadingCard>
          </Container>
        </PageContainer>
      }
    >
      <CallbackPageInner />
    </Suspense>
  );
}
