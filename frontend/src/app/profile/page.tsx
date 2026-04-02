"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/shared/hooks/redux";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";
import styled from "@emotion/styled";
import { PageContainer, Container } from "@/shared/ui/container";
import { Card, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

const ProfileCard = styled(Card)`
  max-width: 600px;
  margin: 40px auto;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #5865f2;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #2c3e50;
`;

const RoleBadge = styled.span<{ role: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  background: ${(props) =>
    props.role === "admin"
      ? "#dc3545"
      : props.role === "moderator"
      ? "#ffc107"
      : "#28a745"};
  color: white;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #6c757d;
`;

const InfoValue = styled.span`
  color: #2c3e50;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    // Очищаем весь кэш React Query
    queryClient.clear();
    // Перенаправляем на главную страницу
    router.push("/");
  };

  if (isLoading || !user) {
    return (
      <PageContainer>
        <Container>
          <ProfileCard>
            <CardTitle>Загрузка...</CardTitle>
          </ProfileCard>
        </Container>
      </PageContainer>
    );
  }

  const avatarUrl = user.avatar?.startsWith("http")
    ? user.avatar
    : user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    : "/default-avatar.png";

  // Fallback for possible snake_case from API
  const discordId =
    (user as unknown as { discordId?: string; discord_id?: string })
      .discordId ||
    (user as unknown as { discordId?: string; discord_id?: string })
      .discord_id ||
    "";

  return (
    <PageContainer>
      <Container>
        <ProfileCard>
          <ProfileHeader>
            <AvatarWrapper>
              <Image
                src={avatarUrl}
                alt={user.username}
                fill
                style={{ objectFit: "cover" }}
              />
            </AvatarWrapper>
            <UserInfo>
              <Username>{user.username}</Username>
              <RoleBadge role={user.role}>
                {user.role === "admin"
                  ? "Администратор"
                  : user.role === "moderator"
                  ? "Модератор"
                  : "Пользователь"}
              </RoleBadge>
            </UserInfo>
          </ProfileHeader>
          <CardContent>
            <InfoRow>
              <InfoLabel>Discord ID:</InfoLabel>
              <InfoValue>{discordId}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Имя пользователя:</InfoLabel>
              <InfoValue>{user.username}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Роль:</InfoLabel>
              <InfoValue>{user.role}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Дата регистрации:</InfoLabel>
              <InfoValue>
                {new Date(user.createdAt).toLocaleDateString("ru-RU")}
              </InfoValue>
            </InfoRow>
          </CardContent>
          <ButtonGroup>
            {user.role === "admin" && (
              <Button onClick={() => router.push("/admin")}>
                Админ панель
              </Button>
            )}
            <Button variant="secondary" onClick={handleLogout}>
              Выйти
            </Button>
          </ButtonGroup>
        </ProfileCard>
      </Container>
    </PageContainer>
  );
}
