import { redirect } from 'next/navigation';

export default function EventDetailRedirect({ params }: { params: { id: string } }) {
    redirect(`/news/${params.id}`);
}
