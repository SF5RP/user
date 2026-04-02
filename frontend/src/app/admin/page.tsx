"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/shared/hooks/redux";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";
import styled from "@emotion/styled";
import { PageContainer, Container } from "@/shared/ui/container";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

const AdminCard = styled(Card)`
  max-width: 1000px;
  margin: 40px auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;

const FunctionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const FunctionCard = styled(Card)`
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const FunctionIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  text-align: center;
`;

const FunctionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const FunctionDescription = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const FunctionButton = styled(Button)`
  width: 100%;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const BackButton = styled.div`
  text-align: center;
  margin-top: 32px;
`;

interface AdminFunction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const adminFunctions: AdminFunction[] = [
  {
    id: "users",
    title: "Управление пользователями",
    description:
      "Просмотр списка пользователей, изменение ролей и управление доступом к системе",
    icon: "👥",
    path: "/admin/users",
    color: "#3b82f6",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { isLoading: isLoadingCurrentUser } = useCurrentUser();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("User role:", currentUser?.role);
    // Временно отключено для тестирования
    // if (!isLoadingCurrentUser && currentUser?.role !== "admin" && currentUser?.role !== "moderator") {
    //   console.log("Redirecting to profile - user role:", currentUser?.role);
    //   router.push("/profile");
    // }
  }, [currentUser, isLoadingCurrentUser, router]);

  const handleFunctionClick = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push("/");
  };

  if (isLoadingCurrentUser) {
    return (
      <PageContainer>
        <Container>
          <AdminCard>
            <LoadingMessage>Загрузка...</LoadingMessage>
          </AdminCard>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <AdminCard>
          <CardContent>
            <Header>
              <Title>Панель администратора</Title>
              <Subtitle>Управление доступом и ролями пользователей</Subtitle>
            </Header>

            <FunctionsGrid>
              {adminFunctions.map((func) => (
                <FunctionCard
                  key={func.id}
                  onClick={() => handleFunctionClick(func.path)}
                >
                  <CardContent>
                    <FunctionIcon>{func.icon}</FunctionIcon>
                    <FunctionTitle>{func.title}</FunctionTitle>
                    <FunctionDescription>
                      {func.description}
                    </FunctionDescription>
                    <FunctionButton variant="primary">
                      Перейти к управлению
                    </FunctionButton>
                  </CardContent>
                </FunctionCard>
              ))}
            </FunctionsGrid>

            <BackButton>
              <Button
                variant="secondary"
                onClick={() => router.push("/profile")}
              >
                ← Вернуться в профиль
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                style={{ marginLeft: "12px" }}
              >
                🚪 Выйти
              </Button>
            </BackButton>
          </CardContent>
        </AdminCard>
      </Container>
    </PageContainer>
  );
}
