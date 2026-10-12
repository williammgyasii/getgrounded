namespace GetGrounded.Application.Hear;

public sealed class InterpretException : Exception
{
    public InterpretException(string message) : base(message) { }
}

public sealed class EmptySpeechException : Exception;

public sealed class SpeechUnavailableException : Exception;

public sealed class ModelUnavailableException : Exception;

public sealed class ClipTooLargeException : Exception;
