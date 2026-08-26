namespace GetGrounded.Application.Book;

public static class Titles
{
    public static string Sentence(string? value)
    {
        var text = value?.Trim() ?? "";
        if (text.Length == 0)
        {
            return text;
        }

        return char.ToUpperInvariant(text[0]) + text[1..];
    }
}
