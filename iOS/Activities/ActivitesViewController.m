//
//  ActivitesViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivitesViewController.h"
#import "ActivityTableCell.h"
#import <RestKit/RestKit.h>
#import "Activity.h"

@interface ActivitesViewController ()

@end

@implementation ActivitesViewController

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.activities = [[NSArray alloc] init];
    
    [self loadActivities];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)loadActivities
{
    RKObjectMapping *activityMapping = [RKObjectMapping mappingForClass:[Activity class]];
    [activityMapping addAttributeMappingsFromDictionary:@{
     @"title": @"title",
     @"start_time": @"start_time",
     @"location": @"location",
     @"max_attendees": @"max_attendees",
     @"description": @"description"
    }];
    
    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:activityMapping pathPattern:nil keyPath:@"activity" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];
    
    NSURL *URL = [NSURL URLWithString:@"http://127.0.0.1:8000/activities/1/"];
    NSURLRequest *request = [NSURLRequest requestWithURL:URL];
    RKObjectRequestOperation *objectRequestOperation = [[RKObjectRequestOperation alloc] initWithRequest:request responseDescriptors:@[ responseDescriptor ]];
    [objectRequestOperation setCompletionBlockWithSuccess:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
//        RKLogInfo(@"Load collection of Activities: %@", mappingResult.array);
        self.activities = mappingResult.array;
        [self.tableView reloadData];
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        RKLogError(@"Operation failed with error: %@", error);
    }];
    
    [objectRequestOperation start];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.activities count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell Identifier";
    ActivityTableCell *cell = (ActivityTableCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil)
    {
        NSArray *nib = [[NSBundle mainBundle] loadNibNamed:@"ActivityTableCell" owner:self options:nil];
        cell = [nib objectAtIndex:0];
    }
    
    Activity *activity = [self.activities objectAtIndex:indexPath.row];
    NSString *activityTitle = [activity title];
    NSString *description = [activity description];
    NSString *location = [activity location];
    NSString *userName = @"Owen Campbell-Moore";
    [self setTextInCell :cell activityTitle:activityTitle userName:userName description:description location:location];
    
    return cell;
}

- (void)setTextInCell:(ActivityTableCell *)cell activityTitle:(NSString *) activityTitle userName:(NSString *)userName description:(NSString *)description location:(NSString *)location {
    
    cell.activityLabel.attributedText = [self getAttributedActivity:userName activityTitle:activityTitle];
    cell.descriptionLabel.text = description;
    cell.locationLabel.text = [@"Location: " stringByAppendingString:location];
    
}

-(NSMutableAttributedString *)getAttributedActivity:(NSString *)userName activityTitle:(NSString *)activityTitle
{
    NSString *dateText = @" tomorrow at 7pm";
    NSString *joinedString = [[[userName stringByAppendingString:@" is "] stringByAppendingString:activityTitle] stringByAppendingString:dateText];
    // Define general attributes for the entire text
    NSDictionary *attribs = @{};
    UIFont *largeText = [UIFont fontWithName:@"Roboto" size:16];
    UIFont *smallText = [UIFont fontWithName:@"Roboto-Light" size:14];
    UIColor *veryDarkGrey = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
    UIColor *lessDarkGrey = [UIColor colorWithRed:0.2 green:0.2 blue:0.2 alpha:1];
    NSDictionary *largeTextAttributes = @{NSFontAttributeName: largeText,
                                         NSForegroundColorAttributeName: veryDarkGrey};
    NSDictionary *smallTextAttributes = @{NSFontAttributeName: smallText,
                                          NSForegroundColorAttributeName: lessDarkGrey};
    NSMutableAttributedString *attributedText =
    [[NSMutableAttributedString alloc] initWithString:joinedString
                                           attributes:attribs];
    NSRange userNameRange = {0, [userName length]};
    NSRange isRange = {[userName length], 4};
    NSRange activityRange = {[userName length]+4, [activityTitle length]};
    NSRange dateRange = {[userName length]+4+[activityTitle length], [dateText length]};
    [attributedText setAttributes:largeTextAttributes range:userNameRange];
    [attributedText setAttributes:smallTextAttributes range:isRange];
    [attributedText setAttributes:largeTextAttributes range:activityRange];
    [attributedText setAttributes:smallTextAttributes range:dateRange];
    return attributedText;
}


- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (self.selectedCell && indexPath.row == self.selectedCell.row) {
        return 150;
    } else {
        return 86;
    }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    self.selectedCell = indexPath;
    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
}

-(void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath {
    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
    [tableView beginUpdates];
    [tableView endUpdates];
    //Displaying and hiding items is managed by the cell itself
}

- (void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
    cell.backgroundColor = [UIColor colorWithRed:0.94 green:0.94 blue:0.94 alpha:1];
}

@end
