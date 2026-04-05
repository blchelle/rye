import Foundation
import ScreenCaptureKit

let MEET_HOST_BUNDLES: Set<String> = [
    "com.google.Chrome",
    "com.google.Chrome.canary",
    "org.mozilla.firefox",
    "com.apple.Safari",
    "com.microsoft.edgemac",
    "com.google.meet",
]

struct DetectionResult: Codable {
    let sharing: Bool
    let app: String?
    let windowTitle: String?
    let error: String?
}

func printResult(_ result: DetectionResult) {
    let encoder = JSONEncoder()
    if let data = try? encoder.encode(result),
       let json = String(data: data, encoding: .utf8) {
        print(json)
    }
}

if #available(macOS 12.3, *) {
    let semaphore = DispatchSemaphore(value: 0)

    Task {
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(
                false,
                onScreenWindowsOnly: true
            )

            let meetApps = content.applications.filter {
                MEET_HOST_BUNDLES.contains($0.bundleIdentifier)
            }

            if meetApps.isEmpty {
                printResult(DetectionResult(sharing: false, app: nil, windowTitle: nil, error: nil))
                semaphore.signal()
                return
            }

            let meetWindows = content.windows.filter { window in
                guard let app = window.owningApplication else { return false }
                guard MEET_HOST_BUNDLES.contains(app.bundleIdentifier) else { return false }
                let title = window.title ?? ""
                return title.localizedCaseInsensitiveContains("meet") ||
                       title.localizedCaseInsensitiveContains("google meet")
            }

            if meetWindows.isEmpty {
                printResult(DetectionResult(sharing: false, app: nil, windowTitle: nil, error: nil))
                semaphore.signal()
                return
            }

            let sharingIndicatorPresent = content.windows.contains { window in
                let ownerBundle = window.owningApplication?.bundleIdentifier ?? ""
                let title = window.title ?? ""
                return ownerBundle == "com.apple.screencaptureui" ||
                       ownerBundle.contains("screencaptureui") ||
                       title.contains("is sharing your screen") ||
                       title.contains("Sharing Indicator")
            }

            if sharingIndicatorPresent {
                let app = meetWindows.first?.owningApplication
                printResult(DetectionResult(
                    sharing: true,
                    app: app?.applicationName,
                    windowTitle: meetWindows.first?.title,
                    error: nil
                ))
            } else {
                printResult(DetectionResult(sharing: false, app: nil, windowTitle: nil, error: nil))
            }

        } catch {
            printResult(DetectionResult(
                sharing: false,
                app: nil,
                windowTitle: nil,
                error: error.localizedDescription
            ))
        }

        semaphore.signal()
    }

    semaphore.wait()

} else {
    printResult(DetectionResult(
        sharing: false,
        app: nil,
        windowTitle: nil,
        error: "ScreenCaptureKit requires macOS 12.3 or later"
    ))
}
