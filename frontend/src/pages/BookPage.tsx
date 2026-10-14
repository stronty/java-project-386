import { Container, Stack, Text, Title } from '@mantine/core';

export default function BookPage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="xs">
        <Title order={1}>Страница записи</Title>
        <Text c="dimmed">Скоро.</Text>
      </Stack>
    </Container>
  );
}
