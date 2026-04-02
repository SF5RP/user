"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/shared/hooks/redux";
import { useCurrentUser } from "@/features/auth/hooks";
import { useUsers, useUpdateUserRole } from "@/features/admin/hooks";
import styled from "@emotion/styled";
import { PageContainer, Container } from "@/shared/ui/container";
import { Card, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { UserRole } from "@/shared/types/auth";

const AdminCard = styled(Card)`
  max-width: 1000px;
  margin: 40px auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const UsersTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #6c757d;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: white;

  &:focus {
    outline: none;
    border-color: #5865f2;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
`;

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { isLoading: isLoadingCurrentUser } = useCurrentUser();
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { mutate: updateRole } = useUpdateUserRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>(
    {}
  );

  useEffect(() => {
    if (!isLoadingCurrentUser && currentUser?.role !== "admin") {
      router.push("/profile");
    }
  }, [currentUser, isLoadingCurrentUser, router]);

  useEffect(() => {
    if (users) {
      const roles: Record<string, UserRole> = {};
      users.forEach((user) => {
        roles[user.id] = user.role;
      });
      setSelectedRoles(roles);
    }
  }, [users]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: newRole }));
    updateRole({ userId, role: newRole });
  };

  if (isLoadingCurrentUser || isLoadingUsers) {
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

  if (!users || users.length === 0) {
    return (
      <PageContainer>
        <Container>
          <AdminCard>
            <Header>
              <CardTitle>Управление пользователями</CardTitle>
              <Button variant="secondary" onClick={() => router.push("/admin")}>
                ← Назад к админ панели
              </Button>
            </Header>
            <LoadingMessage>Пользователи не найдены</LoadingMessage>
          </AdminCard>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <AdminCard>
          <Header>
            <CardTitle>Управление пользователями ({users.length})</CardTitle>
            <Button variant="secondary" onClick={() => router.push("/admin")}>
              ← Назад к админ панели
            </Button>
          </Header>
          <UsersTable>
            <Table>
              <thead>
                <tr>
                  <Th>Пользователь</Th>
                  <Th>Discord ID</Th>
                  <Th>Роль</Th>
                  <Th>Дата регистрации</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const avatarUrl = user.avatar?.startsWith("http")
                    ? user.avatar
                    : user.avatar
                    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
                    : "/default-avatar.png";

                  return (
                    <tr key={user.id}>
                      <Td>
                        <UserCell>
                          <Avatar>
                            <Image
                              src={avatarUrl}
                              alt={user.username}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </Avatar>
                          <span>
                            {user.username}#{user.discriminator}
                          </span>
                        </UserCell>
                      </Td>
                      <Td>{user.discordId}</Td>
                      <Td>
                        <Select
                          value={selectedRoles[user.id] || user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as UserRole
                            )
                          }
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="user">Пользователь</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </Select>
                      </Td>
                      <Td>
                        {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </UsersTable>
        </AdminCard>
      </Container>
    </PageContainer>
  );
}
