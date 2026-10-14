import { Button, Container, List, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Выберите тип встречи',
    body: 'Посмотрите, какие встречи можно забронировать, и выберите подходящую.',
  },
  {
    title: 'Выберите свободный слот',
    body: 'Откройте календарь и найдите время, которое вам подходит.',
  },
  {
    title: 'Получите подтверждение',
    body: 'Оставьте имя и почту — и запись готова.',
  },
];

export default function HomePage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Title order={1}>Запишитесь на встречу</Title>
        <Text>
          Это общий календарь для записи на встречи. Выберите тип встречи и
          свободное время — без регистрации и аккаунта.
        </Text>
        <Title order={2} size="h4">
          Как это работает
        </Title>
        <List spacing="xs">
          {STEPS.map((step) => (
            <List.Item key={step.title}>
              <Text fw={500}>{step.title}</Text>
              <Text c="dimmed">{step.body}</Text>
            </List.Item>
          ))}
        </List>
        <Button component={Link} to="/book" w="fit-content">
          Выбрать время
        </Button>
      </Stack>
    </Container>
  );
}
