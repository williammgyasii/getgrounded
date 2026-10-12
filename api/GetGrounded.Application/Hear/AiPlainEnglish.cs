using System.Text.RegularExpressions;

namespace GetGrounded.Application.Hear;

public static partial class AiPlainEnglish
{
    public static string Clean(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var line = text.Trim();
        line = line.Replace('\u2014', '.').Replace('\u2013', ',');
        line = HyphenBreak().Replace(line, ", ");
        while (WordHyphen().IsMatch(line))
        {
            line = WordHyphen().Replace(line, "$1 $2");
        }
        line = SpaceBeforePeriod().Replace(line, ".");
        line = MultiSpace().Replace(line, " ");
        line = MultiPeriod().Replace(line, ".");
        return line.Trim();
    }

    [GeneratedRegex(@"\s-\s")]
    private static partial Regex HyphenBreak();

    [GeneratedRegex(@"\b(\w+)-(\w+)\b")]
    private static partial Regex WordHyphen();

    [GeneratedRegex(@"\s+\.")]
    private static partial Regex SpaceBeforePeriod();

    [GeneratedRegex(@"[ ]{2,}")]
    private static partial Regex MultiSpace();

    [GeneratedRegex(@"\.{2,}")]
    private static partial Regex MultiPeriod();
}
