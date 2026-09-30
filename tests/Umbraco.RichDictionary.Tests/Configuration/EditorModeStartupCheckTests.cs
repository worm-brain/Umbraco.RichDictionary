using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Notifications;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.Tests.Configuration;

public class EditorModeStartupCheckTests
{
    /// <summary>A logger that keeps what was logged, so tests can assert on the output.</summary>
    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter
        ) => Entries.Add((logLevel, formatter(state, exception)));
    }

    private static RecordingLogger<EditorModeStartupCheck> RunCheck(string? editorMode)
    {
        var settings = new Dictionary<string, string?>();
        if (editorMode is not null)
        {
            settings["RichDictionary:EditorMode"] = editorMode;
        }

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var logger = new RecordingLogger<EditorModeStartupCheck>();

        new EditorModeStartupCheck(configuration, logger).Handle(
            new UmbracoApplicationStartingNotification(
                Umbraco.Cms.Core.RuntimeLevel.Run,
                isRestarting: false
            )
        );

        return logger;
    }

    [Fact]
    public void Handle_WithUnrecognisedEditorMode_LogsWarningNamingTheValue()
    {
        // Act
        var logger = RunCheck("Nonsense");

        // Assert
        var entry = Assert.Single(logger.Entries);
        Assert.Equal(
            (
                LogLevel.Warning,
                "RichDictionary:EditorMode is set to Nonsense, which is not a recognised editor mode, so Rte is used instead. Valid values: Rte, Markdown."
            ),
            entry
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Rte")]
    [InlineData("markdown")]
    public void Handle_WithMissingOrValidEditorMode_LogsNothing(string? editorMode)
    {
        // Act
        var logger = RunCheck(editorMode);

        // Assert
        Assert.Empty(logger.Entries);
    }
}
