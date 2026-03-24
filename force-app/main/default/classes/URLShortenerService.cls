public class URLShortenerService {

    @InvocableMethod
    public static void shortenURL(List<Request> requests) {
        for (Request request : requests) {
            System.enqueueJob(new TinyURLShortenerQueueable(request.longUrl, request.emailAddress));
        }
    }

    public class Request {
        @InvocableVariable
        public String longUrl;

        @InvocableVariable
        public String emailAddress;
    }
}